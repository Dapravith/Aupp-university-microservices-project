const { validationResult } = require('express-validator');
const Teacher = require('../models/Teacher');
const studentApiService = require('../services/studentApiService');

// POST /teachers/profile - Create teacher profile
const createProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array().map((e) => e.msg)
      });
    }

    const userId = req.user.userId;
    const username = req.user.username;
    const { fullName, email, faculty } = req.body;

    // Check if teacher profile already exists
    const existingTeacher = await Teacher.findOne({
      $or: [{ userId }, { email }]
    });

    if (existingTeacher) {
      return res.status(409).json({
        success: false,
        message: 'Teacher profile already exists'
      });
    }

    const teacher = new Teacher({
      userId,
      username,
      fullName,
      email,
      faculty
    });

    await teacher.save();

    return res.status(201).json({
      success: true,
      message: 'Teacher profile created successfully',
      data: teacher
    });
  } catch (err) {
    next(err);
  }
};

// GET /teachers/me - Get current teacher profile
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const teacher = await Teacher.findOne({ userId });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher profile retrieved successfully',
      data: teacher
    });
  } catch (err) {
    next(err);
  }
};

// PUT /teachers/me - Update current teacher profile
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array().map((e) => e.msg)
      });
    }

    const userId = req.user.userId;
    const { fullName, email, faculty } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (faculty !== undefined) updateData.faculty = faculty;

    const teacher = await Teacher.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher profile updated successfully',
      data: teacher
    });
  } catch (err) {
    next(err);
  }
};

// GET /teachers/students/search - Search students
const searchStudents = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || !String(q).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const students = await studentApiService.searchStudents(String(q).trim());

    return res.status(200).json({
      success: true,
      message: 'Students search results',
      data: students
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  searchStudents
};
