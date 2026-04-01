const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Teacher = require('../models/Teacher');

// POST /teachers/assignments - Create assignment
const createAssignment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array().map((e) => e.msg)
      });
    }

    // Get teacherUserId from JWT token (req.user), NOT from body
    const teacherUserId = req.user.userId;
    const { title, description, subject, dueDate } = req.body;

    const teacher = await Teacher.findOne({ userId: teacherUserId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found. Please create teacher profile first.'
      });
    }

    const assignment = new Assignment({
      teacherId: teacher._id,
      teacherUserId: teacher.userId,
      title,
      description,
      subject,
      dueDate,
      isActive: true
    });

    await assignment.save();

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (err) {
    next(err);
  }
};

// GET /teachers/assignments - List current teacher's assignments
const getAssignments = async (req, res, next) => {
  try {
    // Default to current teacher's assignments using JWT userId
    const teacherUserId = req.user.userId;
    const { subject, isActive } = req.query;

    const filter = { teacherUserId };

    if (subject) {
      filter.subject = { $regex: subject, $options: 'i' };
    }

    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }

    const assignments = await Assignment.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Assignments retrieved successfully',
      count: assignments.length,
      data: assignments
    });
  } catch (err) {
    next(err);
  }
};

// GET /teachers/assignments/:id - Get assignment by ID
const getAssignmentById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array().map((e) => e.msg)
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment retrieved successfully',
      data: assignment
    });
  } catch (err) {
    next(err);
  }
};

// PUT /teachers/assignments/:id - Update assignment (owner only)
const updateAssignment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array().map((e) => e.msg)
      });
    }

    const { id } = req.params;
    // Get teacherUserId from JWT token, NOT from body
    const teacherUserId = req.user.userId;
    const { title, description, subject, dueDate, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Ownership check: only the teacher who created can update
    if (assignment.teacherUserId !== teacherUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized permission to access. Only the assignment owner can update.'
      });
    }

    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (subject !== undefined) assignment.subject = subject;
    if (dueDate !== undefined) assignment.dueDate = dueDate;
    if (typeof isActive !== 'undefined') assignment.isActive = isActive;

    assignment.updatedAt = new Date();

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: assignment
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /teachers/assignments/:id - Soft delete (owner only)
const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Get teacherUserId from JWT token, NOT from body
    const teacherUserId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID format'
      });
    }

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Ownership check: only the teacher who created can delete
    if (assignment.teacherUserId !== teacherUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized permission to access. Only the assignment owner can delete.'
      });
    }

    assignment.isActive = false;
    assignment.updatedAt = new Date();

    await assignment.save();

    return res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully (soft delete)',
      data: assignment
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
};
