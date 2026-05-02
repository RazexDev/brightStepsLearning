require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  console.log('\n🔍 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI, {
    family: 4,
    serverSelectionTimeoutMS: 10000,
  });
  console.log('✅ Connected!\n');

  const User = require('./models/User');

  // List all existing users
  const allUsers = await User.find({}, 'name email role customId');
  console.log(`📋 Users in DB (${allUsers.length} total):`);
  if (allUsers.length === 0) {
    console.log('   (No users found — database is empty)');
  } else {
    allUsers.forEach(u => console.log(`   - [${u.role}] ${u.email} | ${u.name} | ID: ${u.customId}`));
  }

  // Check if hiru@gmail.com exists
  const existing = await User.findOne({ email: 'hiru@gmail.com' });
  if (existing) {
    console.log('\n✅ User hiru@gmail.com already exists. No action needed.');
    console.log('   Try logging in with the password you originally registered with.');
    console.log('   If forgotten, run this script with --reset to reset the password to "1234".');

    if (process.argv.includes('--reset')) {
      existing.password = '1234';
      await existing.save(); // pre-save hook will hash it
      console.log('\n🔑 Password has been RESET to: 1234');
    }
  } else {
    console.log('\n➕ Creating user hiru@gmail.com...');
    const studentCount = await User.countDocuments({ role: 'student' });
    const user = await User.create({
      name: 'Hirusha',
      email: 'hiru@gmail.com',
      password: '1234',
      role: 'student',
      customId: `ST${String(studentCount + 1).padStart(3, '0')}`,
      diagnosis: 'None',
    });
    console.log(`✅ Created! Name: ${user.name} | Email: ${user.email} | Role: ${user.role} | ID: ${user.customId}`);
    console.log('   You can now log in with: hiru@gmail.com / 1234');
  }

  await mongoose.disconnect();
  console.log('\n✅ Done.');
}

run().catch(err => {
  console.error('💥 Error:', err.message);
  process.exit(1);
});
