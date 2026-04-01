const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const teacherController = require('../controllers/teacherController');

const router = express.Router();

// POST /teachers/profile - Create teacher profile
router.post(
  '/profile',
  authMiddleware,
  roleMiddleware(['teacher']),
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('faculty').notEmpty().withMessage('Faculty is required')
  ],
  teacherController.createProfile
);

// GET /teachers/me - Get current teacher profile
router.get(
  '/me',
  authMiddleware,
  roleMiddleware(['teacher']),
  teacherController.getProfile
);

// PUT /teachers/me - Update current teacher profile
router.put(
  '/me',
  authMiddleware,
  roleMiddleware(['teacher']),
  [
    body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('faculty').optional().notEmpty().withMessage('Faculty cannot be empty')
  ],
  teacherController.updateProfile
);

// GET /teachers/students/search - Search students
router.get(
  '/students/search',
  authMiddleware,
  roleMiddleware(['teacher']),
  teacherController.searchStudents
);

module.exports = router;
