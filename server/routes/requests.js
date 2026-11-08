const router = require('express').Router();
const AdoptionRequest = require('../models/AdoptionRequest');
const Pet = require('../models/Pet');
const { protect } = require('../middleware/auth');
const { notifyUsers } = require('../utils/notify');

// Send an adoption request
router.post('/pet/:petId', protect, async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.petId);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    if (String(pet.owner) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot adopt your own pet' });
    }

    if (pet.status === 'adopted') {
      return res.status(400).json({ message: 'This pet has already been adopted' });
    }

    const existing = await AdoptionRequest.findOne({
      pet: pet._id,
      requester: req.user._id
    });

    if (existing && existing.status !== 'cancelled') {
      return res.status(409).json({
        message: 'You already sent a request for this pet'
      });
    }

    const request = existing
      ? Object.assign(existing, {
          status: 'pending',
          message: req.body.message || ''
        })
      : new AdoptionRequest({
          pet: pet._id,
          requester: req.user._id,
          owner: pet.owner,
          message: req.body.message || ''
        });

    await request.save();

    await notifyUsers(req.app.get('io'), [pet.owner], {
      type: 'adoption_request',
      title: `${req.user.name} wants to adopt ${pet.name}`,
      body: request.message.slice(0, 120),
      link: '/dashboard?tab=received'
    });

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

// Get adoption requests
// Normal user: sent or received
// Admin: all requests using ?role=all
router.get('/mine', protect, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';

    let filter;

    if (isAdmin && req.query.role === 'all') {
      filter = {};
    } else if (req.query.role === 'received') {
      filter = { owner: req.user._id };
    } else {
      filter = { requester: req.user._id };
    }

    const requests = await AdoptionRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('pet', 'name images species status')
      .populate('requester', 'name email phone city')
      .populate('owner', 'name');

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// Check if current user already requested a pet
router.get('/pet/:petId/status', protect, async (req, res, next) => {
  try {
    const r = await AdoptionRequest.findOne({
      pet: req.params.petId,
      requester: req.user._id
    });

    res.json(r ? { status: r.status } : { status: null });
  } catch (err) {
    next(err);
  }
});

// Owner approves/rejects, requester cancels, admin approves/rejects
router.patch('/:id', protect, async (req, res, next) => {
  try {
    const { status } = req.body;

    const request = await AdoptionRequest.findById(req.params.id)
      .populate('pet');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const isOwner = String(request.owner) === String(req.user._id);
    const isRequester = String(request.requester) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    const io = req.app.get('io');

    // Requester can cancel their own request
    if (isRequester && status === 'cancelled') {
      if (request.status !== 'pending') {
        return res.status(400).json({
          message: 'Only pending requests can be cancelled'
        });
      }

      request.status = 'cancelled';
    }

    // Owner or admin can approve/reject
    else if (
      (isOwner || isAdmin) &&
      ['approved', 'rejected'].includes(status)
    ) {
      if (request.status !== 'pending') {
        return res.status(400).json({
          message: 'Only pending requests can be approved or rejected'
        });
      }

      request.status = status;

      if (status === 'approved') {
        request.pet.status = 'adopted';
        await request.pet.save();

        const others = await AdoptionRequest.find({
          pet: request.pet._id,
          _id: { $ne: request._id },
          status: 'pending'
        });

        for (const o of others) {
          o.status = 'rejected';
        }

        await Promise.all(others.map((o) => o.save()));

        await notifyUsers(io, others.map((o) => o.requester), {
          type: 'request_update',
          title: `${request.pet.name} found a home`,
          body: 'Another adopter was approved for this pet.',
          link: '/pets'
        });
      }

      await notifyUsers(io, [request.requester], {
        type: 'request_update',
        title: status === 'approved'
          ? `Your request for ${request.pet.name} was approved`
          : `Your request for ${request.pet.name} was declined`,
        body: status === 'approved'
          ? 'Message the owner to arrange the handover.'
          : 'Keep browsing, there are more pets waiting.',
        link: status === 'approved'
          ? `/messages?to=${request.owner}&pet=${request.pet._id}`
          : '/pets'
      });
    }

    else {
      return res.status(403).json({
        message: 'You cannot make this change'
      });
    }

    await request.save();

    res.json(request);
  } catch (err) {
    next(err);
  }
});

module.exports = router;