const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2 to 60 characters'),
  body('email').trim().isEmail().withMessage('Enter a valid email address'),
  body('password').isLength({ min: 6, max: 100 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Phone number is too long'),
];
const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', registerRules, validate, async (req, res, next) => {
  try {
    const { name, email, password, phone, city } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'An account with this email already exists' });
    const user = await User.create({ name, email, password, phone, city });
    const safe = await User.findById(user._id);
    res.status(201).json({ token: sign(user._id), user: safe });
  } catch (err) {
    next(err);
  }
});

router.post('/login', loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password || '')))
      return res.status(401).json({ message: 'Incorrect email or password' });
    const safe = await User.findById(user._id);
    res.json({ token: sign(user._id), user: safe });
  } catch (err) {
    next(err);
  }
});

router.get('/me', protect, (req, res) => res.json(req.user));

router.put('/me', protect, async (req, res, next) => {
  try {
    const { name, phone, city, notifyNewPets } = req.body;
    if (name !== undefined) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    if (city !== undefined) req.user.city = city;
    if (notifyNewPets !== undefined) req.user.notifyNewPets = !!notifyNewPets;
    await req.user.save();
    res.json(req.user);
  } catch (err) {
    next(err);
  }
});

// Public basic info (used by the messaging screen)
router.get('/users/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name city');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
