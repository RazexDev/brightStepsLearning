require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function patch() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'kamala@gmail.com';
    const pin = '1234';

    const result = await User.updateOne(
      { email },
      { $set: { parentPin: pin } }
    );

    if (result.matchedCount === 0) {
      console.log(`❌ No user found with email: ${email}`);
    } else {
      console.log(`✅ Successfully patched ${email}. PIN set to ${pin}`);
    }

  } catch (err) {
    console.error('❌ Patch error:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

patch();
