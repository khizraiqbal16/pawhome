require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');

async function createAdmin() {
  try {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error('Admin credentials missing in .env');
    }

    if (process.env.ADMIN_PASSWORD.length < 6) {
      throw new Error('Admin password must be at least 6 characters');
    }

    await mongoose.connect(process.env.MONGO_URI);

    const email = process.env.ADMIN_EMAIL.toLowerCase().trim();

    let admin = await User.findOne({ email });

    if (admin) {
      if (admin.role !== 'admin') {
        throw new Error(
          'This email already belongs to a normal user. Choose another admin email.'
        );
      }

      console.log('Admin account already exists.');
    } else {
      admin = await User.create({
        name: 'PawHome Admin',
        email,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
      });

      console.log('Admin account created successfully!');
    }
  } catch (error) {
    console.error('Admin creation failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();