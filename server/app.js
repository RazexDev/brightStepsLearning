/**
 * app.js — Pure Express app export (no DB connect, no listen).
 * Used by Supertest so tests never touch a live database or open a port.
 */
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/test', (req, res) => res.json({ success: true, message: 'Backend is reachable!' }));

// All API routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));
app.use('/api/progress',  require('./routes/progressRoutes'));
app.use('/api/games',     require('./routes/gamesRoutes'));
app.use('/api/routines',  require('./routes/routines'));

module.exports = app;
