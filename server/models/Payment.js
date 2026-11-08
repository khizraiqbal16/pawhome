const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    type: { type: String, enum: ['adoption_fee', 'donation'], required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'usd' },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    mode: { type: String, enum: ['stripe', 'demo'], default: 'demo' },
    stripeSessionId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', schema);
