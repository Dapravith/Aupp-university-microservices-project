const express = require('express');
const {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

const router = express.Router();

router.use(verifyToken);

router.get('/', authorizeRoles('admin', 'student', 'teacher'), listStudents);
router.get('/:id', authorizeRoles('admin', 'student', 'teacher'), getStudent);
router.post('/', authorizeRoles('admin', 'student'), createStudent);
router.put('/:id', authorizeRoles('admin', 'student'), updateStudent);
router.delete('/:id', authorizeRoles('admin'), deleteStudent);

module.exports = router;
