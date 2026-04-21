require('dotenv').config();
const mongoose = require('mongoose');
const Progress = require('./models/Progress');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const p = await Progress.find({
    $or: [
      { gameName: { $exists: true, $ne: '' } },
      { score: { $gt: 0 } },
      { stars: { $gt: 0 } },
      { activity: { $regex: /game/i } }
    ]
  });
  console.log("Total matching game-like docs:", p.length);
  for (let i = 0; i < 5; i++) {
    if (p[i]) console.log(JSON.stringify(p[i], null, 2));
  }
  process.exit(0);
});
