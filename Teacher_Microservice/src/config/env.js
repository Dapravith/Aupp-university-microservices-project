require('dotenv').config();
module.exports = {
  PORT: Number(process.env.PORT || 5002),
  JWT_SECRET: process.env.JWT_SECRET || 'task07_super_secret_key',
  STUDENT_SERVICE_URL: process.env.STUDENT_SERVICE_URL || 'http://localhost:5001'
};
