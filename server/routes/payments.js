const router = require('express').Router();
const Payment = require('../models/Payment');
const Pet = require('../models/Pet');
const { protect } = require('../middleware/auth');
const { notifyUsers } = require('../utils/notify');

const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const CURRENCY = process.env.CURRENCY || 'usd';

router.use(protect);

router.get('/config', (req, res) => res.json({ mode: stripe ? 'stripe' : 'demo', currency: CURRENCY }));

// Start a payment. Stripe Checkout when a key is configured, otherwise demo mode.
router.post('/checkout', async (req, res, next) => {
  try {
    const { type, petId } = req.body;
    const amount = Number(req.body.amount);
    if (!['adoption_fee', 'donation'].includes(type)) return res.status(400).json({ message: 'Invalid payment type' });
    if (!amount || amount < 1) return res.status(400).json({ message: 'Enter an amount of at least 1' });

    let pet = null;
    if (petId) {
      pet = await Pet.findById(petId);
      if (!pet) return res.status(404).json({ message: 'Pet not found' });
    }

    const payment = await Payment.create({
      user: req.user._id,
      pet: pet ? pet._id : undefined,
      type,
      amount,
      currency: CURRENCY,
      mode: stripe ? 'stripe' : 'demo',
    });

    if (!stripe) {
      return res.json({ url: `${CLIENT_URL}/payment/success?payment=${payment._id}` });
    }

    const label = type === 'adoption_fee' && pet ? `Adoption fee for ${pet.name}` : pet ? `Donation for ${pet.name}` : 'Donation to PawHome';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ quantity: 1, price_data: { currency: CURRENCY, unit_amount: Math.round(amount * 100), product_data: { name: label } } }],
      success_url: `${CLIENT_URL}/payment/success?payment=${payment._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/donate`,
      metadata: { paymentId: String(payment._id) },
    });
    payment.stripeSessionId = session.id;
    await payment.save();
    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

// Called from the success page to verify and finalise the payment
router.post('/confirm', async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ _id: req.body.paymentId, user: req.user._id }).populate('pet', 'name owner');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (payment.status !== 'paid') {
      if (payment.mode === 'stripe') {
        const session = await stripe.checkout.sessions.retrieve(payment.stripeSessionId);
        if (session.payment_status !== 'paid') {
          return res.status(402).json({ message: 'Payment was not completed' });
        }
      }
      payment.status = 'paid';
      await payment.save();

      if (payment.pet) {
        await notifyUsers(req.app.get('io'), [payment.pet.owner], {
          type: 'payment',
          title: payment.type === 'adoption_fee' ? `Adoption fee paid for ${payment.pet.name}` : `New donation for ${payment.pet.name}`,
          body: `${req.user.name} paid ${payment.amount} ${payment.currency.toUpperCase()}`,
          link: `/pets/${payment.pet._id}`,
        });
      }
    }
    res.json(payment);
  } catch (err) {
    next(err);
  }
});

router.get('/mine', async (req, res, next) => {
  try {
    res.json(await Payment.find({ user: req.user._id, status: 'paid' }).sort({ createdAt: -1 }).populate('pet', 'name'));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
