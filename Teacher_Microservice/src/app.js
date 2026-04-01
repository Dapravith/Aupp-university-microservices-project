const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'task07_super_secret_key';
const STUDENT_SERVICE_URL = process.env.STUDENT_SERVICE_URL || 'http://localhost:5001';

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

const teachers = [];
const assignments = [];
let seq = 1000;
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

const findTeacherByUserId = (userId) => teachers.find((t) => t.userId === userId);
const findAssignmentById = (id) => assignments.find((a) => a._id === id);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Teacher Microservice is running' });
});

app.post('/teachers/profile', auth, role(['teacher']), (req, res) => {
  const { fullName, email, faculty } = req.body || {};
  if (!fullName || !email || !faculty) {
    return res.status(400).json({ success: false, message: 'Validation error', errors: ['Full name, email and faculty are required'] });
  }
  if (teachers.some((t) => t.userId === req.user.userId || t.email === email)) {
    return res.status(409).json({ success: false, message: 'Teacher profile already exists' });
  }
  const teacher = { _id: makeId(), userId: req.user.userId, username: req.user.username, fullName, email, faculty, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  teachers.push(teacher);
  res.status(201).json({ success: true, message: 'Teacher profile created successfully', data: teacher });
});

app.get('/teachers/me', auth, role(['teacher']), (req, res) => {
  const teacher = findTeacherByUserId(req.user.userId);
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });
  res.status(200).json({ success: true, message: 'Teacher profile retrieved successfully', data: teacher });
});

app.put('/teachers/me', auth, role(['teacher']), (req, res) => {
  const teacher = findTeacherByUserId(req.user.userId);
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });
  ['fullName','email','faculty'].forEach((k) => { if (req.body[k] !== undefined) teacher[k] = req.body[k]; });
  teacher.updatedAt = new Date().toISOString();
  res.status(200).json({ success: true, message: 'Teacher profile updated successfully', data: teacher });
});

app.get('/teachers/students/search', auth, role(['teacher']), async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ success: false, message: 'Search query is required' });
  try {
    const response = await axios.get(`${STUDENT_SERVICE_URL}/students/search`, { params: { q }, timeout: 5000 });
    res.status(response.status).json({ success: true, message: 'Students search results', data: response.data.data || [] });
  } catch (error) {
    res.status(502).json({ success: false, message: 'Failed to search students' });
  }
});

app.get('/teachers/students/:id', auth, role(['teacher']), async (req, res) => {
  try {
    const response = await axios.get(`${STUDENT_SERVICE_URL}/students/${req.params.id}`, { headers: { authorization: req.headers.authorization }, timeout: 5000 });
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json(error.response?.data || { success: false, message: 'Failed to fetch student profile' });
  }
});

app.post('/teachers/assignments', auth, role(['teacher']), (req, res) => {
  const { title, description, subject, dueDate } = req.body || {};
  if (!title || !description || !subject || !dueDate) {
    return res.status(400).json({ success: false, message: 'Validation error', errors: ['Title, description, subject and dueDate are required'] });
  }
  const teacher = findTeacherByUserId(req.user.userId);
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found. Please create teacher profile first.' });
  const assignment = { _id: makeId(), teacherId: teacher._id, teacherUserId: teacher.userId, title, description, subject, dueDate, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  assignments.push(assignment);
  res.status(201).json({ success: true, message: 'Assignment created successfully', data: assignment });
});

app.get('/teachers/assignments', auth, role(['teacher']), (req, res) => {
  let data = assignments.filter((a) => a.teacherUserId === req.user.userId);
  if (req.query.subject) data = data.filter((a) => a.subject.toLowerCase().includes(String(req.query.subject).toLowerCase()));
  if (typeof req.query.isActive !== 'undefined') data = data.filter((a) => a.isActive === (String(req.query.isActive) === 'true'));
  res.status(200).json({ success: true, message: 'Assignments retrieved successfully', count: data.length, data });
});

app.get('/teachers/assignments/public', (req, res) => {
  let data = assignments.filter((a) => a.isActive);
  if (req.query.subject) data = data.filter((a) => a.subject.toLowerCase().includes(String(req.query.subject).toLowerCase()));
  res.status(200).json({ success: true, message: 'Public assignments retrieved successfully', count: data.length, data });
});

app.get('/teachers/assignments/public/:id', (req, res) => {
  const assignment = findAssignmentById(req.params.id);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
  res.status(200).json({ success: true, message: 'Assignment retrieved successfully', data: assignment });
});

app.get('/teachers/assignments/:id', auth, role(['teacher']), (req, res) => {
  const assignment = findAssignmentById(req.params.id);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
  res.status(200).json({ success: true, message: 'Assignment retrieved successfully', data: assignment });
});

app.put('/teachers/assignments/:id', auth, role(['teacher']), (req, res) => {
  const assignment = findAssignmentById(req.params.id);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
  if (assignment.teacherUserId !== req.user.userId) return res.status(403).json({ success: false, message: 'Unauthorized permission to access. Only the assignment owner can update.' });
  ['title','description','subject','dueDate','isActive'].forEach((k) => { if (req.body[k] !== undefined) assignment[k] = req.body[k]; });
  assignment.updatedAt = new Date().toISOString();
  res.status(200).json({ success: true, message: 'Assignment updated successfully', data: assignment });
});

app.delete('/teachers/assignments/:id', auth, role(['teacher']), (req, res) => {
  const assignment = findAssignmentById(req.params.id);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
  if (assignment.teacherUserId !== req.user.userId) return res.status(403).json({ success: false, message: 'Unauthorized permission to access. Only the assignment owner can delete.' });
  assignment.isActive = false;
  assignment.updatedAt = new Date().toISOString();
  res.status(200).json({ success: true, message: 'Assignment deleted successfully (soft delete)', data: assignment });
});

app.put('/teachers/submissions/:submissionId/review', auth, role(['teacher']), async (req, res) => {
  const { score, feedback } = req.body || {};
  if (score === undefined || feedback === undefined) {
    return res.status(400).json({ success: false, message: 'Validation error', errors: ['score and feedback are required'] });
  }
  if (Number(score) < 0 || Number(score) > 100) {
    return res.status(400).json({ success: false, message: 'Score must be between 0 and 100' });
  }
  try {
    await axios.get(`${STUDENT_SERVICE_URL}/students/internal/${req.params.submissionId}`, { timeout: 5000 });
  } catch (error) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }
  try {
    const response = await axios.patch(`${STUDENT_SERVICE_URL}/students/internal/${req.params.submissionId}/review`, { score: Number(score), feedback, status: 'reviewed' }, { timeout: 5000 });
    res.status(200).json({ success: true, message: 'Submission reviewed successfully', data: response.data.data });
  } catch (error) {
    res.status(502).json({ success: false, message: 'Failed to update submission review' });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;
