const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const studentApiService = require('../services/studentApiService');

// PUT /teachers/submissions/:submissionId/review - Review submission
exports.reviewSubmission = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array().map(e => e.msg)
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.submissionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission ID format'
      });
    }

    const { score, feedback } = req.body;

    // Validate score range
    if (score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        message: 'Score must be between 0 and 100'
      });
    }

    // Get submission details from student service
    let submissionDetails;
    try {
      submissionDetails = await studentApiService.getSubmissionDetails(req.params.submissionId);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Update submission with review via student service
    const updatedSubmission = await studentApiService.updateSubmissionReview(
      req.params.submissionId,
      {
        score,
        feedback,
        status: 'reviewed'
      }
    );

    res.json({
      success: true,
      message: 'Submission reviewed successfully',
      data: updatedSubmission
    });
  } catch (err) {
    next(err);
  }
};

module.exports = exports;
