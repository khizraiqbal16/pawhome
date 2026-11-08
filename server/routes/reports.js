const router = require('express').Router();
const Report = require('../models/Report');
const Pet = require('../models/Pet');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');

router.post('/pet/:petId', protect, async (req, res, next) => {
  try {
    const reason = (req.body.reason || '').trim();
    if (reason.length < 5) return res.status(400).json({ message: 'Please describe the problem (at least 5 characters)' });
    if (!(await Pet.exists({ _id: req.params.petId }))) return res.status(404).json({ message: 'Pet not found' });
    if (await Report.exists({ pet: req.params.petId, reporter: req.user._id }))
      return res.status(409).json({ message: 'You already reported this listing' });
    res.status(201).json(await Report.create({ pet: req.params.petId, reporter: req.user._id, reason }));
  } catch (err) {
    next(err);
  }
});

router.get('/', protect, admin, async (req, res, next) => {
  try {
    res.json(
      await Report.find()
        .sort({ status: -1, createdAt: -1 })
        .populate('pet', 'name images species owner')
        .populate('reporter', 'name email')
    );
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/resolve', protect, admin, async (req, res, next) => {
  try {
    res.json(await Report.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;