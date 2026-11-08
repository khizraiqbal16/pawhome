const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['new_pet', 'adoption_request', 'request_update', 'payment'], required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    link: { type: String, default: '/' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', schema);
