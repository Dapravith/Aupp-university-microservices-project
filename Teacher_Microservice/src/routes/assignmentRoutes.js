const express = require('express');
const { body, param } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const assignmentController = require('../controllers/assignmentController');

const router = express.Router();

// GET /teachers/assignments/public/:id - Public endpoint for student service verification (NO AUTH)
router.get(
  '/public/:id',
  [
    param('id').isMongoId().withMessage('Valid assignment ID is required')
  ],
  assignmentController.getAssignmentById
);

// POST /teachers/assignments - Create assignment
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['teacher']),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('dueDate').isISO8601().withMessage('Due date must be a valid date')
  ],
  assignmentController.createAssignment
);

// GET /teachers/assignments - Get all assignments
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['teacher']),
  assignmentController.getAssignments
);

// GET /teachers/assignments/:id - Get assignment by ID
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['teacher']),
  [
    param('id').isMongoId().withMessage('Valid assignment ID is required')
  ],
  assignmentController.getAssignmentById
);

// PUT /teachers/assignments/:id - Update assignment
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['teacher']),
  [
    param('id').isMongoId().withMessage('Valid assignment ID is required'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().notEmpty().withMessage('Description cannot be empty'),
    body('subject').optional().notEmpty().withMessage('Subject cannot be empty'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ],
  assignmentController.updateAssignment
);

// DELETE /teachers/assignments/:id - Delete assignment
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['teacher']),
  [
    param('id').isMongoId().withMessage('Valid assignment ID is required')
  ],
  assignmentController.deleteAssignment
);

module.exports = router;
