const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }
    if (role && !['admin', 'student', 'teacher'].includes(role)) {
      return res.status(400).json({ success: false, message: 'role must be admin, student or teacher' });
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, role: role || 'student' });
    return res.status(201).json({
      success: true,
      message: 'User registered',
      data: user.toSafe(),
      token: signToken(user)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: signToken(user),
      data: user.toSafe()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function me(req, res) {
  const user = await User.findById(req.user.userId).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return res.status(200).json({ success: true, data: user });
}

async function listUsers(req, res) {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  return res.status(200).json({ success: true, count: users.length, data: users });
}

module.exports = { register, login, me, listUsers };
