const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'task07_super_secret_key';
const TEACHER_SERVICE_URL = process.env.TEACHER_SERVICE_URL || 'http://localhost:5002';

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

const students = [];
const submissions = [];
let seq = 1;
const makeId = () => (seq++).toString(16).padStart(24, '0');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    req.user = jwt.verify(authHeader.slice(7), JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const role = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Unauthorized permission to access. Your role '${req.user.role}' does not have permission to access this resource. Required role: ${roles.join(' or ')}.` });
  }
  next();
};

const findStudentByUserId = (userId) => students.find((s) => s.userId === userId);
const findStudentById = (id) => students.find((s) => s._id === id);
const findSubmissionById = (id) => submissions.find((s) => s._id === id);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Student Microservice is running' });
});

app.get('/students/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ success: false, message: 'Search query is required' });
  const query = q.toLowerCase();
  const data = students.filter((s) => [s.fullName, s.username, s.department, s.email].some((v) => String(v).toLowerCase().includes(query)));
  res.status(200).json({ success: true, message: 'Students found', data });
});

app.post('/students/profile', auth, role(['student']), (req, res) => {
  const { fullName, email, department, yearLevel } = req.body || {};
  if (!fullName || !email || !department || !yearLevel) {
    return res.status(400).json({ success: false, message: 'Validation error', data: ['Full name, email, department and year level are required'] });
  }
  if (findStudentByUserId(req.user.userId)) {
    return res.status(409).json({ success: false, message: 'Student profile already exists' });
  }
  const student = { _id: makeId(), userId: req.user.userId, username: req.user.username, fullName, email, department, yearLevel, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  students.push(student);
  res.status(201).json({ success: true, message: 'Student profile created successfully', data: student });
});

app.get('/students/me', auth, role(['student']), (req, res) => {
  const student = findStudentByUserId(req.user.userId);
  if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
  res.status(200).json({ success: true, message: 'Student profile fetched successfully', data: student });
});

app.put('/students/me', auth, role(['student']), (req, res) => {
  const student = findStudentByUserId(req.user.userId);
  if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
  ['fullName','email','department','yearLevel'].forEach((k) => { if (req.body[k] !== undefined) student[k] = req.body[k]; });
  student.updatedAt = new Date().toISOString();
  res.status(200).json({ success: true, message: 'Student profile updated successfully', data: student });
});

app.get('/students/assignments', auth, role(['student']), async (req, res) => {
  const student = findStudentByUserId(req.user.userId);
  if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
  try {
    const response = await axios.get(`${TEACHER_SERVICE_URL}/teachers/assignments/public`, { params: req.query, timeout: 5000 });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(502).json({ success: false, message: 'Failed to fetch assignments from teacher service' });
  }
});

app.get('/students/assignments/my-submissions', auth, role(['student']), (req, res) => {
  const student = findStudentByUserId(req.user.userId);
  if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
  const data = submissions.filter((s) => s.studentId === student._id).sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
  res.status(200).json({ success: true, message: 'Submissions retrieved successfully', data });
});

app.get('/students/assignments/submission/:id', auth, role(['student']), (req, res) => {
  const submission = findSubmissionById(req.params.id);
  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
  if (submission.studentUserId !== req.user.userId) return res.status(403).json({ success: false, message: 'You do not have permission to view this submission' });
  res.status(200).json({ success: true, message: 'Submission retrieved successfully', data: submission });
});

app.put('/students/assignments/submission/:id', auth, role(['student']), (req, res) => {
  const submission = findSubmissionById(req.params.id);
  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
  if (submission.studentUserId !== req.user.userId) return res.status(403).json({ success: false, message: 'You do not have permission to edit this submission' });
  if (submission.status === 'reviewed') return res.status(400).json({ success: false, message: 'Cannot edit a reviewed submission' });
  if (req.body.title !== undefined) submission.title = req.body.title;
  if (req.body.content !== undefined) submission.content = req.body.content;
  submission.updatedAt = new Date().toISOString();
  res.status(200).json({ success: true, message: 'Submission updated successfully', data: submission });
});

app.get('/students/assignments/:assignmentId', auth, role(['student']), async (req, res) => {
  try {
    const response = await axios.get(`${TEACHER_SERVICE_URL}/teachers/assignments/public/${req.params.assignmentId}`, { timeout: 5000 });
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json(error.response?.data || { success: false, message: 'Failed to fetch assignment from teacher service' });
  }
});

app.post('/students/assignments/submit', auth, role(['student']), async (req, res) => {
  const { assignmentId, title, content } = req.body || {};
  if (!assignmentId || !title || !content) {
    return res.status(400).json({ success: false, message: 'Validation error', errors: ['Assignment ID, title and content are required'] });
  }
  const student = findStudentByUserId(req.user.userId);
  if (!student) return res.status(404).json({ success: false, message: 'Student profile not found. Please create a profile first' });
  try {
    const verify = await axios.get(`${TEACHER_SERVICE_URL}/teachers/assignments/public/${assignmentId}`, { timeout: 5000 });
    if (!verify.data?.data?.isActive) {
      return res.status(400).json({ success: false, message: 'Assignment is not active' });
    }
  } catch (error) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }
  const existing = submissions.find((s) => s.studentId === student._id && s.assignmentId === assignmentId);
  if (existing) {
    if (existing.status === 'reviewed') {
      return res.status(400).json({ success: false, message: 'Cannot resubmit a reviewed assignment' });
    }
    existing.title = title;
    existing.content = content;
    existing.status = 'submitted';
    existing.submittedAt = new Date().toISOString();
    existing.updatedAt = new Date().toISOString();
    return res.status(200).json({ success: true, message: 'Assignment resubmitted successfully', data: existing });
  }
  const submission = { _id: makeId(), studentId: student._id, studentUserId: req.user.userId, assignmentId, title, content, status: 'submitted', score: null, feedback: null, submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  submissions.push(submission);
  res.status(201).json({ success: true, message: 'Assignment submitted successfully', data: submission });
});

app.get('/students/:id', auth, role(['teacher', 'student']), (req, res) => {
  const student = findStudentById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
  res.status(200).json({ success: true, message: 'Student profile fetched successfully', data: student });
});

app.get('/students/internal/:id', (req, res) => {
  const submission = findSubmissionById(req.params.id);
  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
  res.status(200).json({ success: true, message: 'Submission retrieved successfully', data: submission });
});

app.patch('/students/internal/:id/review', (req, res) => {
  const submission = findSubmissionById(req.params.id);
  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
  if (req.body.score !== undefined) submission.score = req.body.score;
  if (req.body.feedback !== undefined) submission.feedback = req.body.feedback;
  submission.status = 'reviewed';
  submission.updatedAt = new Date().toISOString();
  res.status(200).json({ success: true, message: 'Submission reviewed successfully', data: submission });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;
