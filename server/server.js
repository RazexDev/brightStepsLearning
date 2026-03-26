require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const resourceRoutes = require('./routes/resourceRoutes');

// Force Node.js to use public DNS servers (fixes your ECONNREFUSED SRV error)
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use('/api/resources', resourceRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    family: 4   // Forces IPv4 (keeps your fix working)
})
.then(() => {
    console.log('✅ MongoDB Connected Successfully!');
})
.catch((err) => {
    console.error('❌ MongoDB Connection Failed:');
    console.error(err.message);
    process.exit(1);   // Exit if DB fails (good practice for production)
});

// Basic Route
app.get('/', (req, res) => {
    res.send('BrightSteps API is running...');
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});