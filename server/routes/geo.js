const router = require('express').Router();
const { geocode } = require('../utils/geo');

// GET /api/geo/geocode?q=Karachi
router.get('/geocode', async (req, res) => {
  const result = await geocode(req.query.q);
  if (!result) return res.status(404).json({ message: 'Location not found. Try a nearby city name.' });
  res.json(result);
});

module.exports = router;
