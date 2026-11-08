const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const Pet = require('../models/Pet');
const User = require('../models/User');
const AdoptionRequest = require('../models/AdoptionRequest');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { geocode, distanceKm } = require('../utils/geo');
const { notifyUsers } = require('../utils/notify');
const { saveImages } = require('../utils/images');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const petRules = [
  body('name').trim().isLength({ min: 1, max: 60 }).withMessage('Name is required (max 60 characters)'),
  body('species').isIn(['dog', 'cat', 'rabbit', 'bird', 'other']).withMessage('Choose a valid species'),
  body('gender').isIn(['male', 'female']).withMessage('Choose a valid gender'),
  body('description').trim().isLength({ min: 10, max: 3000 }).withMessage('Description must be 10 to 3000 characters'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('age').optional({ checkFalsy: true }).isFloat({ min: 0, max: 40 }).withMessage('Age must be between 0 and 40'),
  body('adoptionFee').optional({ checkFalsy: true }).isFloat({ min: 0, max: 100000 }).withMessage('Fee must be a positive number'),
];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTS = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, youngest: { age: 1 }, oldest_pet: { age: -1 } };

// Browse + search + filter (+ location radius)
router.get('/', async (req, res, next) => {
  try {
    const { q, species, breed, gender, size, city, status = 'available', lat, lng, radius = 50, sort = 'newest' } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 48);

    const filter = {};
    if (status !== 'all') filter.status = status;
    if (species) filter.species = species;
    if (gender) filter.gender = gender;
    if (size) filter.size = size;
    if (breed) filter.breed = new RegExp(escapeRegex(breed), 'i');
    if (city) filter['location.city'] = new RegExp(escapeRegex(city), 'i');
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ name: rx }, { breed: rx }, { description: rx }];
    }

    const hasGeo = lat && lng && !isNaN(+lat) && !isNaN(+lng);
    if (hasGeo) {
      filter['location.geo'] = { $geoWithin: { $centerSphere: [[+lng, +lat], +radius / 6378.1] } };
    }

    const mongoSort = SORTS[sort] || SORTS.newest;

    if (hasGeo) {
      let pets = await Pet.find(filter).sort(mongoSort).populate('owner', 'name city').lean();
      pets = pets.map((p) => ({
        ...p,
        distanceKm: Math.round(distanceKm(+lat, +lng, p.location.geo.coordinates[1], p.location.geo.coordinates[0]) * 10) / 10,
      }));
      if (sort === 'nearest') pets.sort((a, b) => a.distanceKm - b.distanceKm);
      const total = pets.length;
      return res.json({ pets: pets.slice((page - 1) * limit, page * limit), total, pages: Math.ceil(total / limit) || 1 });
    }

    const [pets, total] = await Promise.all([
      Pet.find(filter).sort(mongoSort).skip((page - 1) * limit).limit(limit).populate('owner', 'name city').lean(),
      Pet.countDocuments(filter),
    ]);
    res.json({ pets, total, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
});

router.get('/mine', protect, async (req, res, next) => {
  try {
    res.json(await Pet.find({ owner: req.user._id }).sort({ createdAt: -1 }));
  } catch (err) {
    next(err);
  }
});

router.get('/:id/similar', async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    const list = await Pet.find({ _id: { $ne: pet._id }, species: pet.species, status: 'available' })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('owner', 'name city')
      .lean();
    // Same city first
    list.sort((a, b) => (b.location.city === pet.location.city) - (a.location.city === pet.location.city));
    res.json(list.slice(0, 3));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id).populate('owner', 'name city createdAt');
    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    res.json(pet);
  } catch (err) {
    next(err);
  }
});

const bool = (v) => v === true || v === 'true' || v === 'on';

async function resolveLocation(body) {
  const city = (body.city || '').trim();
  let geo;
  if (body.lat && body.lng && !isNaN(+body.lat) && !isNaN(+body.lng)) {
    geo = { type: 'Point', coordinates: [+body.lng, +body.lat] };
  } else if (city) {
    const found = await geocode(city);
    if (found) geo = { type: 'Point', coordinates: [found.lng, found.lat] };
  }
  return { city, geo };
}

// Create listing
router.post('/', protect, upload.array('images', 5), petRules, validate, async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.name || !b.species || !b.gender || !b.description || !b.city)
      return res.status(400).json({ message: 'Name, species, gender, description and city are required' });

    const location = await resolveLocation(b);
    const pet = await Pet.create({
      owner: req.user._id,
      name: b.name,
      species: b.species,
      breed: b.breed || 'Mixed',
      age: Number(b.age) || 0,
      gender: b.gender,
      size: b.size || 'medium',
      description: b.description,
      vaccinated: bool(b.vaccinated),
      neutered: bool(b.neutered),
      adoptionFee: Number(b.adoptionFee) || 0,
      images: await saveImages(req.files),
      location,
    });

    // Notify users who opted in to new pet alerts
    const io = req.app.get('io');
    const users = await User.find({ notifyNewPets: true, _id: { $ne: req.user._id } }).select('_id').limit(1000);
    await notifyUsers(io, users.map((u) => u._id), {
      type: 'new_pet',
      title: `New ${pet.species} available: ${pet.name}`,
      body: `${pet.breed} in ${pet.location.city}`,
      link: `/pets/${pet._id}`,
    });

    res.status(201).json(pet);
  } catch (err) {
    next(err);
  }
});

// Update listing
router.put('/:id', protect, upload.array('images', 5), async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    const isOwner = String(pet.owner) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ message: 'You can only edit your own listings' });

    const b = req.body;
    ['name', 'species', 'breed', 'gender', 'size', 'description', 'status'].forEach((k) => {
      if (b[k] !== undefined && b[k] !== '') pet[k] = b[k];
    });
    if (b.age !== undefined) pet.age = Number(b.age) || 0;
    if (b.adoptionFee !== undefined) pet.adoptionFee = Number(b.adoptionFee) || 0;
    if (b.vaccinated !== undefined) pet.vaccinated = bool(b.vaccinated);
    if (b.neutered !== undefined) pet.neutered = bool(b.neutered);

    if (b.city && (b.city.trim() !== pet.location.city || b.lat)) {
      pet.location = await resolveLocation(b);
    }

    // Keep only the images the owner chose to keep, then add new uploads
    if (b.existingImages !== undefined) {
      const keep = JSON.parse(b.existingImages || '[]');
      pet.images.filter((img) => !keep.includes(img) && img.startsWith('/uploads/')).forEach((img) =>
        fs.unlink(path.join(__dirname, '..', img), () => {})
      );
      pet.images = keep;
    }
    pet.images.push(...(await saveImages(req.files)));

    await pet.save();
    res.json(pet);
  } catch (err) {
    next(err);
  }
});

// Delete listing
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    if (String(pet.owner) !== String(req.user._id) && req.user.role !== 'admin')
      return res.status(403).json({ message: 'You can only delete your own listings' });
    pet.images.filter((i) => i.startsWith('/uploads/')).forEach((i) => fs.unlink(path.join(__dirname, '..', i), () => {}));
    await AdoptionRequest.deleteMany({ pet: pet._id });
    await pet.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
