const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function listTeachers(req, res) {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getTeacher(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    return res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createTeacher(req, res) {
  try {
    const { name, teacherId, subject, email } = req.body || {};
    if (!name || !teacherId || !subject || !email) {
      return res.status(400).json({
        success: false,
        message: 'name, teacherId, subject and email are required'
      });
    }
    const exists = await Teacher.findOne({ $or: [{ teacherId }, { email: email.toLowerCase() }] });
    if (exists) {
      return res.status(409).json({ success: false, message: 'teacherId or email already exists' });
    }
    const teacher = await Teacher.create({ name, teacherId, subject, email });
    return res.status(201).json({ success: true, message: 'Teacher created', data: teacher });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateTeacher(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const updates = {};
    ['name', 'teacherId', 'subject', 'email'].forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    return res.status(200).json({ success: true, message: 'Teacher updated', data: teacher });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteTeacher(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    return res.status(200).json({ success: true, message: 'Teacher deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { listTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher };
