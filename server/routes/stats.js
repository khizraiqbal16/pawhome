const router = require('express').Router();
const Pet = require('../models/Pet');
const AdoptionRequest = require('../models/AdoptionRequest');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

router.get('/overview', protect, async (req, res, next) => {
  try {
    const me = req.user._id;
    const petIds = await Pet.find({ owner: me }).distinct('_id');

    const [byStatus, bySpecies, requests, received] = await Promise.all([
      Pet.aggregate([{ $match: { owner: me } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Pet.aggregate([{ $match: { owner: me } }, { $group: { _id: '$species', count: { $sum: 1 } } }]),
      AdoptionRequest.aggregate([{ $match: { owner: me } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Payment.aggregate([
        { $match: { pet: { $in: petIds }, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));
    res.json({
      listings: toMap(byStatus),
      species: bySpecies.map((r) => ({ name: r._id, count: r.count })),
      requests: toMap(requests),
      moneyReceived: received[0]?.total || 0,
      totalListings: petIds.length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
