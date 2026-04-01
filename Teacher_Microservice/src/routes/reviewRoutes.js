const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Review submission route (teacher only)
router.put(
  '/:submissionId/review',
  authMiddleware,
  roleMiddleware(['teacher']),
  [
    body('score')
      .isInt({ min: 0, max: 100 })
      .withMessage('Score must be an integer between 0 and 100'),
    body('feedback')
      .notEmpty()
      .withMessage('Feedback is required')
      .isString()
      .withMessage('Feedback must be a string')
  ],
  reviewController.reviewSubmission
);

module.exports = router;
