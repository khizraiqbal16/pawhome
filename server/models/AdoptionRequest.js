const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
);

schema.index({ pet: 1, requester: 1 }, { unique: true });

module.exports = mongoose.model('AdoptionRequest', schema);
