const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

mongoose.connection.on('connected', () => console.log('MongoDB connected'));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));

async function connect() {
  await mongoose.connect(MONGO_URI);
}

async function close() {
  await mongoose.disconnect();
}

module.exports = { connect, close };
