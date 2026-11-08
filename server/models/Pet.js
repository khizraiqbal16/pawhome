const mongoose = require('mongoose');

const petSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    species: { type: String, enum: ['dog', 'cat', 'rabbit', 'bird', 'other'], required: true },
    breed: { type: String, trim: true, default: 'Mixed' },
    age: { type: Number, min: 0, default: 1 }, // years
    gender: { type: String, enum: ['male', 'female'], required: true },
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    description: { type: String, required: true },
    images: [String],
    status: { type: String, enum: ['available', 'pending', 'adopted'], default: 'available' },
    vaccinated: { type: Boolean, default: false },
    neutered: { type: Boolean, default: false },
    adoptionFee: { type: Number, min: 0, default: 0 },
    location: {
      city: { type: String, required: true, trim: true },
      geo: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number], default: undefined }, // [lng, lat]
      },
    },
  },
  { timestamps: true }
);

petSchema.index({ 'location.geo': '2dsphere' });

module.exports = mongoose.model('Pet', petSchema);
