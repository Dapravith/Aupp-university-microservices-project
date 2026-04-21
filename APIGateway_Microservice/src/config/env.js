require('dotenv').config();

const required = ['AUTH_SERVICE_URL', 'STUDENT_SERVICE_URL', 'TEACHER_SERVICE_URL'];
required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  PORT: Number(process.env.PORT) || 4000,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
  STUDENT_SERVICE_URL: process.env.STUDENT_SERVICE_URL,
  TEACHER_SERVICE_URL: process.env.TEACHER_SERVICE_URL
};
