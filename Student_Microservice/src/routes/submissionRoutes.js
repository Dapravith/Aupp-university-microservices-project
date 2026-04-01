const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const submissionController = require('../controllers/submissionController');

const router = express.Router();

// INTERNAL endpoints (no auth required)
router.get('/internal/:id', submissionController.getSubmissionInternal);

router.patch(
  '/internal/:id/review',
  [
    body('score')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Score must be between 0 and 100'),
    body('feedback')
      .optional()
      .trim()
      .isString()
      .withMessage('Feedback must be a string')
  ],
  submissionController.updateSubmissionForReview
);

// Protected endpoints - Student only
router.post(
  '/assignments/submit',
  authMiddleware,
  roleMiddleware(['student']),
  [
    body('assignmentId').trim().notEmpty().withMessage('Assignment ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required')
  ],
  submissionController.submitAssignment
);

router.get(
  '/assignments/my-submissions',
  authMiddleware,
  roleMiddleware(['student']),
  submissionController.getMySubmissions
);

router.get(
  '/assignments/submission/:id',
  authMiddleware,
  roleMiddleware(['student']),
  submissionController.getSubmission
);

router.put(
  '/assignments/submission/:id',
  authMiddleware,
  roleMiddleware(['student']),
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional().trim().notEmpty().withMessage('Content cannot be empty')
  ],
  submissionController.updateSubmission
);

module.exports = router;