const router = require('express').Router();
const { body } = require('express-validator');
const Story = require('../models/Story');
const Pet = require('../models/Pet');
const AdoptionRequest = require('../models/AdoptionRequest');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Adopted pets the user owns, or pets they were approved to adopt
async function eligiblePets(userId) {
  const owned = await Pet.find({ owner: userId, status: 'adopted' }).select('name');
  const approved = await AdoptionRequest.find({ requester: userId, status: 'approved' }).populate('pet', 'name');
  const map = new Map();
  [...owned, ...approved.map((r) => r.pet).filter(Boolean)].forEach((p) => map.set(String(p._id), p));
  return [...map.values()];
}

router.get('/', async (req, res, next) => {
  try {
    res.json(
      await Story.find()
        .sort({ createdAt: -1 })
        .limit(60)
        .populate('pet', 'name images species breed')
        .populate('author', 'name')
    );
  } catch (err) {
    next(err);
  }
});

router.get('/eligible', protect, async (req, res, next) => {
  try {
    res.json(await eligiblePets(req.user._id));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  protect,
  [
    body('petId').notEmpty().withMessage('Choose a pet'),
    body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3 to 100 characters'),
    body('text').trim().isLength({ min: 20, max: 2000 }).withMessage('Story must be 20 to 2000 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const allowed = await eligiblePets(req.user._id);
      if (!allowed.some((p) => String(p._id) === req.body.petId))
        return res.status(403).json({ message: 'You can only share a story about a pet you adopted or gave a home' });
      const story = await Story.create({ pet: req.body.petId, author: req.user._id, title: req.body.title, text: req.body.text });
      res.status(201).json(story);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    if (String(story.author) !== String(req.user._id) && req.user.role !== 'admin')
      return res.status(403).json({ message: 'You can only delete your own story' });
    await story.deleteOne();
    res.json({ message: 'Story deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
