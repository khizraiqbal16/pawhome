const router = require('express').Router();
const User = require('../models/User');
const Pet = require('../models/Pet');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      populate: { path: 'owner', select: 'name city' },
    });
    res.json(user.favorites);
  } catch (err) {
    next(err);
  }
});

// Toggle: adds if missing, removes if present
router.post('/:petId', async (req, res, next) => {
  try {
    const id = req.params.petId;
    if (!(await Pet.exists({ _id: id }))) return res.status(404).json({ message: 'Pet not found' });
    const has = req.user.favorites.some((f) => String(f) === id);
    req.user.favorites = has ? req.user.favorites.filter((f) => String(f) !== id) : [...req.user.favorites, id];
    await req.user.save();
    res.json({ favorites: req.user.favorites, favorited: !has });
  } catch (err) {
    next(err);
  }
});

module.exports = router;