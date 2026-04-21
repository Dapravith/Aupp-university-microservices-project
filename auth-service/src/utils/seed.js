const User = require('../models/User');

const SEED_USERS = [
  { name: 'Admin User',   email: 'admin@university.edu',   password: 'Admin@123',   role: 'admin' },
  { name: 'Student User', email: 'student@university.edu', password: 'Student@123', role: 'student' },
  { name: 'Teacher User', email: 'teacher@university.edu', password: 'Teacher@123', role: 'teacher' }
];

async function seedUsers() {
  const results = [];
  for (const data of SEED_USERS) {
    const exists = await User.findOne({ email: data.email });
    if (exists) {
      results.push({ email: data.email, status: 'exists' });
      continue;
    }
    await User.create(data);
    results.push({ email: data.email, status: 'created' });
  }
  return results;
}

module.exports = { seedUsers, SEED_USERS };
