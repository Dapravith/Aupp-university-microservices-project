const express = require('express');
const { register, login, me, listUsers } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, me);
router.get('/users', verifyToken, authorizeRoles('admin'), listUsers);

module.exports = router;
