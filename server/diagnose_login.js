require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TEST_EMAIL = 'hiru@gmail.com';
const TEST_PASSWORD = '1234';

async function diagnose() {
  console.log('\n🔍 Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ MongoDB CONNECTED!\n');
  } catch (err) {
    console.error('❌ MongoDB FAILED to connect:', err.message);
    process.exit(1);
  }

  const User = require('./models/User');

  // Check if user exists
  console.log(`🔍 Looking for user: ${TEST_EMAIL}`);
  const user = await User.findOne({ email: TEST_EMAIL.toLowerCase() });

  if (!user) {
    console.log('❌ USER NOT FOUND in database!');
    console.log('\n📋 All users in DB:');
    const allUsers = await User.find({}, 'name email role');
    if (allUsers.length === 0) {
      console.log('   (No users at all — database is empty!)');
    } else {
      allUsers.forEach(u => console.log(`   - ${u.email} | ${u.name} | ${u.role}`));
    }
  } else {
    console.log(`✅ User found: ${user.name} | Role: ${user.role}`);
    console.log(`   Has password hash: ${!!user.password}`);

    // Test password
    const match = await bcrypt.compare(TEST_PASSWORD, user.password || '');
    if (match) {
      console.log(`✅ Password "${TEST_PASSWORD}" MATCHES! Login should work.`);
    } else {
      console.log(`❌ Password "${TEST_PASSWORD}" does NOT match the stored hash.`);
      console.log('   The account exists but was registered with a different password.');
    }
  }

  await mongoose.disconnect();
  console.log('\n✅ Done.');
}

diagnose().catch(err => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});
