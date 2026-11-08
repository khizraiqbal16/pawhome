// Run with: npm run seed  (adds demo users and pets)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Pet = require('./models/Pet');

const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const cities = {
  Karachi: [67.0011, 24.8607],
  Lahore: [74.3587, 31.5204],
  Islamabad: [73.0479, 33.6844],
};

const pets = [
  { name: 'Biscuit', species: 'dog', breed: 'Golden Retriever', age: 2, gender: 'male', size: 'large', city: 'Karachi', fee: 0, img: 'photo-1552053831-71594a27632d', description: 'Biscuit is a gentle giant who loves fetch and belly rubs. He is great with children and other dogs.' },
  { name: 'Luna', species: 'cat', breed: 'Domestic Shorthair', age: 1, gender: 'female', size: 'small', city: 'Karachi', fee: 15, img: 'photo-1514888286974-6c03e2ca1dba', description: 'Luna is a curious little cat who loves sunny windowsills. She is litter trained and very affectionate.' },
  { name: 'Rocky', species: 'dog', breed: 'Labrador Mix', age: 4, gender: 'male', size: 'large', city: 'Lahore', fee: 25, img: 'photo-1587300003388-59208cc962cb', description: 'Rocky is calm, loyal and well trained. He walks nicely on a leash and needs a family with a garden.' },
  { name: 'Mochi', species: 'cat', breed: 'Persian', age: 3, gender: 'female', size: 'small', city: 'Islamabad', fee: 40, img: 'photo-1573865526739-10659fec78a5', description: 'Mochi is a quiet lap cat who enjoys gentle brushing. She would suit a calm home.' },
  { name: 'Coco', species: 'dog', breed: 'Beagle', age: 1, gender: 'female', size: 'medium', city: 'Karachi', fee: 10, img: 'photo-1543466835-00a7907e9de1', description: 'Coco is full of energy and loves to sniff out every corner of the park. Daily walks are a must.' },
  { name: 'Clover', species: 'rabbit', breed: 'Holland Lop', age: 1, gender: 'female', size: 'small', city: 'Lahore', fee: 5, img: 'photo-1535241749838-299277b6305f', description: 'Clover is a soft, social bunny who enjoys fresh greens and gentle cuddles.' },
  { name: 'Shadow', species: 'cat', breed: 'Black Domestic', age: 5, gender: 'male', size: 'medium', city: 'Karachi', fee: 0, img: 'photo-1561037404-61cd46aa615b', description: 'Shadow is a relaxed senior cat who just wants a warm bed and a quiet companion.' },
  { name: 'Pepper', species: 'dog', breed: 'Husky Mix', age: 2, gender: 'female', size: 'large', city: 'Islamabad', fee: 30, img: 'photo-1425082661705-1834bfd09dca', description: 'Pepper is playful and smart. She needs lots of exercise and an owner who enjoys the outdoors.' },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  // Remove only the demo data from earlier runs (other users' pets are kept)
  const demoUsers = await User.find({ email: { $in: ['demo@pawhome.com', 'adopter@pawhome.com'] } }).select('_id');
  const demoIds = demoUsers.map((u) => u._id);
  await Pet.deleteMany({ owner: { $in: demoIds } });
  await User.deleteMany({ _id: { $in: demoIds } });

  const owner = await User.create({ name: 'Demo Owner', email: 'demo@pawhome.com', password: 'password123', city: 'Karachi' });
  await User.create({ name: 'Demo Adopter', email: 'adopter@pawhome.com', password: 'password123', city: 'Karachi' });

  await Pet.insertMany(
    pets.map((p) => ({
      owner: owner._id,
      name: p.name,
      species: p.species,
      breed: p.breed,
      age: p.age,
      gender: p.gender,
      size: p.size,
      description: p.description,
      adoptionFee: p.fee,
      vaccinated: true,
      neutered: p.age > 1,
      images: [U(p.img)],
      location: { city: p.city, geo: { type: 'Point', coordinates: cities[p.city] } },
    }))
  );

  console.log('Seeded. Login: demo@pawhome.com / password123  or  adopter@pawhome.com / password123');
  process.exit(0);
})();
