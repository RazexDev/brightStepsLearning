require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}, 'name email role password customId createdAt').lean();
    console.log('=== USERS IN DATABASE ===');
    console.log('Total users found:', users.length, '\n');

    users.forEach(u => {
      const isBcrypt = u.password ? u.password.startsWith('$2') : false;
      console.log({
        name: u.name,
        email: u.email,
        role: u.role,
        customId: u.customId,
        hasPassword: !!u.password,
        passwordLength: u.password ? u.password.length : 0,
        isBcryptHash: isBcrypt,
        createdAt: u.createdAt
      });
      console.log('---');
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDone. Connection closed.');
    process.exit(0);
  }
}

diagnose();
