require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function testPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    const user = await User.findOne({ email: 'teshi@gmail.com' });
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log('User found:', user.email);
    console.log('Password hash:', user.password);
    
    const isMatch = await bcrypt.compare('1234', user.password);
    console.log('Does "1234" match?', isMatch);
    
    // Also test common passwords just in case
    for (const testPw of ['123456', 'password', 'teshi', 'teshi123', 'admin']) {
      if (await bcrypt.compare(testPw, user.password)) {
        console.log('Actually, the password is:', testPw);
      }
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

testPassword();
