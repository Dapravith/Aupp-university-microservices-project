const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const { seedUsers } = require('./utils/seed');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'auth-service',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.post('/auth/seed', async (req, res) => {
  try {
    const results = await seedUsers();
    return res.status(200).json({ success: true, message: 'Seed complete', data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.use('/auth', authRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
