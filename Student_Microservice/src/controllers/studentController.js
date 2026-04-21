const mongoose = require('mongoose');
const Student = require('../models/Student');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function listStudents(req, res) {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getStudent(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createStudent(req, res) {
  try {
    const { name, studentId, department, email } = req.body || {};
    if (!name || !studentId || !department || !email) {
      return res.status(400).json({
        success: false,
        message: 'name, studentId, department and email are required'
      });
    }
    const exists = await Student.findOne({ $or: [{ studentId }, { email: email.toLowerCase() }] });
    if (exists) {
      return res.status(409).json({ success: false, message: 'studentId or email already exists' });
    }
    const student = await Student.create({ name, studentId, department, email });
    return res.status(201).json({ success: true, message: 'Student created', data: student });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateStudent(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const updates = {};
    ['name', 'studentId', 'department', 'email'].forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    const student = await Student.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.status(200).json({ success: true, message: 'Student updated', data: student });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteStudent(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.status(200).json({ success: true, message: 'Student deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { listStudents, getStudent, createStudent, updateStudent, deleteStudent };
