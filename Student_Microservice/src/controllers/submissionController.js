const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const Student = require('../models/Student');
const teacherApiService = require('../services/teacherApiService');

const submissionController = {
  // POST /students/assignments/submit - Submit assignment
  async submitAssignment(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array().map(err => err.msg)
        });
      }

      const { userId } = req.user;
      const { assignmentId, title, content } = req.body;

      // Get student
      const student = await Student.findOne({ userId });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found. Please create a profile first'
        });
      }

      // Verify assignment exists via teacher service
      const assignmentVerification = await teacherApiService.verifyAssignmentExists(assignmentId);
      if (!assignmentVerification.exists) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      if (!assignmentVerification.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Assignment is not active'
        });
      }

      // Check if submission already exists
      const existingSubmission = await Submission.findOne({
        studentId: student._id,
        assignmentId
      });

      if (existingSubmission) {
        if (existingSubmission.status === 'reviewed') {
          return res.status(400).json({
            success: false,
            message: 'Cannot resubmit a reviewed assignment'
          });
        }
        // Update existing submission
        existingSubmission.title = title;
        existingSubmission.content = content;
        existingSubmission.status = 'submitted';
        existingSubmission.submittedAt = new Date();

        await existingSubmission.save();

        return res.status(200).json({
          success: true,
          message: 'Assignment resubmitted successfully',
          data: existingSubmission
        });
      }

      // Create new submission
      const submission = new Submission({
        studentId: student._id,
        studentUserId: userId,
        assignmentId,
        title,
        content,
        status: 'submitted',
        submittedAt: new Date()
      });

      await submission.save();

      res.status(201).json({
        success: true,
        message: 'Assignment submitted successfully',
        data: submission
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /students/assignments/my-submissions - Get student's submissions
  async getMySubmissions(req, res, next) {
    try {
      const { userId } = req.user;

      const student = await Student.findOne({ userId });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }

      const submissions = await Submission.find({ studentId: student._id })
        .sort({ submittedAt: -1 });

      res.status(200).json({
        success: true,
        message: 'Submissions retrieved successfully',
        data: submissions
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /students/assignments/submission/:id - Get single submission
  async getSubmission(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid submission ID'
        });
      }

      const submission = await Submission.findById(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      // Check if user owns this submission
      if (submission.studentUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this submission'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Submission retrieved successfully',
        data: submission
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /students/assignments/submission/:id - Update submission
  async updateSubmission(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array().map(err => err.msg)
        });
      }

      const { id } = req.params;
      const { userId } = req.user;
      const { title, content } = req.body;

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid submission ID'
        });
      }

      const submission = await Submission.findById(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      // Check if user owns this submission
      if (submission.studentUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to edit this submission'
        });
      }

      // Check if submission is reviewed
      if (submission.status === 'reviewed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit a reviewed submission'
        });
      }

      // Update submission
      submission.title = title || submission.title;
      submission.content = content || submission.content;

      await submission.save();

      res.status(200).json({
        success: true,
        message: 'Submission updated successfully',
        data: submission
      });
    } catch (error) {
      next(error);
    }
  },

  // INTERNAL: GET /internal/submissions/:id - Get submission (no auth)
  async getSubmissionInternal(req, res, next) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid submission ID'
        });
      }

      const submission = await Submission.findById(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Submission retrieved successfully',
        data: submission
      });
    } catch (error) {
      next(error);
    }
  },

  // INTERNAL: PATCH /internal/submissions/:id/review - Update submission for review
  async updateSubmissionForReview(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array().map(err => err.msg)
        });
      }

      const { id } = req.params;
      const { score, feedback } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid submission ID'
        });
      }

      const submission = await Submission.findById(id);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      // Update submission
      if (score !== undefined) submission.score = score;
      if (feedback !== undefined) submission.feedback = feedback;
      submission.status = 'reviewed';

      await submission.save();

      res.status(200).json({
        success: true,
        message: 'Submission reviewed successfully',
        data: submission
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = submissionController;
