const router = require('express').Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

router.use(protect);

// One row per (other user, pet) conversation with last message and unread count
router.get('/conversations', async (req, res, next) => {
  try {
    const me = req.user._id;
    const messages = await Message.find({ $or: [{ sender: me }, { recipient: me }] })
      .sort({ createdAt: -1 })
      .populate('sender recipient', 'name')
      .populate('pet', 'name images');

    const map = new Map();
    for (const m of messages) {
      const other = String(m.sender._id) === String(me) ? m.recipient : m.sender;
      const key = `${other._id}:${m.pet ? m.pet._id : 'none'}`;
      if (!map.has(key)) map.set(key, { key, other, pet: m.pet, lastMessage: m, unread: 0 });
      if (String(m.recipient._id) === String(me) && !m.read) map.get(key).unread += 1;
    }
    res.json([...map.values()]);
  } catch (err) {
    next(err);
  }
});

router.get('/unread-count', async (req, res, next) => {
  try {
    res.json({ count: await Message.countDocuments({ recipient: req.user._id, read: false }) });
  } catch (err) {
    next(err);
  }
});

router.get('/thread/:userId', async (req, res, next) => {
  try {
    const me = req.user._id;
    const other = req.params.userId;
    if (!mongoose.isValidObjectId(other)) return res.status(400).json({ message: 'Invalid user' });
    const petFilter = req.query.pet ? { pet: req.query.pet } : { pet: { $exists: false } };
    const filter = {
      ...petFilter,
      $or: [{ sender: me, recipient: other }, { sender: other, recipient: me }],
    };
    const messages = await Message.find(filter).sort({ createdAt: 1 });
    await Message.updateMany({ ...petFilter, sender: other, recipient: me, read: false }, { read: true });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { recipient, pet, text } = req.body;
    if (!recipient || !text || !text.trim()) return res.status(400).json({ message: 'Message cannot be empty' });
    if (String(recipient) === String(req.user._id)) return res.status(400).json({ message: 'You cannot message yourself' });
    const message = await Message.create({ sender: req.user._id, recipient, pet: pet || undefined, text });
    req.app.get('io').to(`user:${recipient}`).emit('message:new', message);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
