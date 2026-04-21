const express = require('express');
const {
  listTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher
} = require('../controllers/teacherController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

const router = express.Router();

router.use(verifyToken);

router.get('/', authorizeRoles('admin', 'student', 'teacher'), listTeachers);
router.get('/:id', authorizeRoles('admin', 'student', 'teacher'), getTeacher);
router.post('/', authorizeRoles('admin', 'teacher'), createTeacher);
router.put('/:id', authorizeRoles('admin', 'teacher'), updateTeacher);
router.delete('/:id', authorizeRoles('admin'), deleteTeacher);

module.exports = router;
