const { validationResult } = require('express-validator');
const Student = require('../models/Student');

const studentController = {
  // POST /students/profile
  async createProfile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          data: errors.array().map((err) => err.msg)
        });
      }

      const userId = req.user.userId;
      const username = req.user.username;
      const { fullName, email, department, yearLevel } = req.body;

      // Check for duplicate profile
      const existingStudent = await Student.findOne({ userId });
      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: 'Student profile already exists'
        });
      }

      const student = new Student({
        userId,
        username,
        fullName,
        email,
        department,
        yearLevel
      });

      await student.save();

      return res.status(201).json({
        success: true,
        message: 'Student profile created successfully',
        data: student
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /students/me
  async getOwnProfile(req, res, next) {
    try {
      const userId = req.user.userId;

      const student = await Student.findOne({ userId });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Student profile fetched successfully',
        data: student
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /students/me
  async updateOwnProfile(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          data: errors.array().map((err) => err.msg)
        });
      }

      const userId = req.user.userId;
      const { fullName, email, department, yearLevel } = req.body;

      const student = await Student.findOne({ userId });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }

      if (fullName !== undefined) student.fullName = fullName;
      if (email !== undefined) student.email = email;
      if (department !== undefined) student.department = department;
      if (yearLevel !== undefined) student.yearLevel = yearLevel;

      await student.save();

      return res.status(200).json({
        success: true,
        message: 'Student profile updated successfully',
        data: student
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /students/:id
  async getProfileById(req, res, next) {
    try {
      const { id } = req.params;

      const student = await Student.findById(id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Student profile fetched successfully',
        data: student
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /students/search?q=query
  async searchStudents(req, res, next) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const regex = new RegExp(q, 'i');
      const students = await Student.find({
        $or: [
          { fullName: regex },
          { username: regex },
          { department: regex }
        ]
      });

      return res.status(200).json({
        success: true,
        message: 'Students found',
        data: students
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = studentController;
