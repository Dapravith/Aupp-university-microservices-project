const mongoose = require('mongoose');

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle invalid ObjectId
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Handle validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(statusCode).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // Handle duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  console.error(`[ERROR] ${statusCode} - ${message}`, err);

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = { errorMiddleware };
