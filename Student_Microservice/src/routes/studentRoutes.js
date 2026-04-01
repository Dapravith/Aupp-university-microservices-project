const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const studentController = require('../controllers/studentController');

const router = express.Router();

// GET /students/search (public, no auth - for internal service-to-service)
router.get('/search', studentController.searchStudents);

// POST /students/profile (authMiddleware, roleMiddleware(['student']))
router.post(
  '/profile',
  authMiddleware,
  roleMiddleware(['student']),
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('yearLevel').notEmpty().withMessage('Year level is required')
  ],
  studentController.createProfile
);

// GET /students/me (authMiddleware, roleMiddleware(['student']))
router.get('/me', authMiddleware, roleMiddleware(['student']), studentController.getOwnProfile);

// PUT /students/me (authMiddleware, roleMiddleware(['student']))
router.put(
  '/me',
  authMiddleware,
  roleMiddleware(['student']),
  [
    body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('department').optional().notEmpty().withMessage('Department cannot be empty'),
    body('yearLevel').optional().notEmpty().withMessage('Year level cannot be empty')
  ],
  studentController.updateOwnProfile
);

// GET /students/:id (authMiddleware, roleMiddleware(['teacher', 'student']))
router.get('/:id', authMiddleware, roleMiddleware(['teacher', 'student']), studentController.getProfileById);

module.exports = router;
