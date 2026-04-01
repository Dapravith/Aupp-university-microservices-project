const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT || 4000);
const STUDENT_SERVICE_URL = process.env.STUDENT_SERVICE_URL || 'http://localhost:5001';
const TEACHER_SERVICE_URL = process.env.TEACHER_SERVICE_URL || 'http://localhost:5002';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5003';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  return res.status(200).json({ success: true, message: 'API Gateway is running' });
});

const forwardRequest = async (req, res, targetBaseUrl, targetPath) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    const response = await axios({ method: req.method, url: `${targetBaseUrl}${targetPath}`, params: req.query, data: req.body, headers, timeout: 10000 });
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) return res.status(error.response.status).json(error.response.data);
    if (error.code === 'ECONNREFUSED') return res.status(503).json({ success: false, message: `Service unavailable: ${targetBaseUrl} is not running` });
    if (error.code === 'ECONNABORTED') return res.status(504).json({ success: false, message: 'Gateway timeout' });
    return res.status(500).json({ success: false, message: error.message || 'Gateway error' });
  }
};

// Auth
app.post('/auth/register', (req, res) => forwardRequest(req, res, AUTH_SERVICE_URL, '/auth/register'));
app.post('/auth/login', (req, res) => forwardRequest(req, res, AUTH_SERVICE_URL, '/auth/login'));
app.get('/auth/profile', (req, res) => forwardRequest(req, res, AUTH_SERVICE_URL, '/auth/profile'));
app.get('/auth/users', (req, res) => forwardRequest(req, res, AUTH_SERVICE_URL, '/auth/users'));

// Teacher
app.post('/teachers/profile', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, '/teachers/profile'));
app.get('/teachers/me', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, '/teachers/me'));
app.put('/teachers/me', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, '/teachers/me'));
app.get('/teachers/students/search', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, '/teachers/students/search'));
app.get('/teachers/students/:id', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, `/teachers/students/${req.params.id}`));
app.post('/teachers/assignments', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, '/teachers/assignments'));
app.get('/teachers/assignments', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, '/teachers/assignments'));
app.get('/teachers/assignments/public', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, '/teachers/assignments/public'));
app.get('/teachers/assignments/public/:id', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, `/teachers/assignments/public/${req.params.id}`));
app.get('/teachers/assignments/:id', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, `/teachers/assignments/${req.params.id}`));
app.put('/teachers/assignments/:id', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, `/teachers/assignments/${req.params.id}`));
app.delete('/teachers/assignments/:id', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, `/teachers/assignments/${req.params.id}`));
app.put('/teachers/submissions/:submissionId/review', (req, res) => forwardRequest(req, res, TEACHER_SERVICE_URL, `/teachers/submissions/${req.params.submissionId}/review`));

// Student
app.get('/students/search', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, '/students/search'));
app.post('/students/profile', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, '/students/profile'));
app.get('/students/me', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, '/students/me'));
app.put('/students/me', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, '/students/me'));
app.get('/students/assignments/my-submissions', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, '/students/assignments/my-submissions'));
app.get('/students/assignments/submission/:id', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, `/students/assignments/submission/${req.params.id}`));
app.put('/students/assignments/submission/:id', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, `/students/assignments/submission/${req.params.id}`));
app.get('/students/assignments', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, '/students/assignments'));
app.get('/students/assignments/:assignmentId', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, `/students/assignments/${req.params.assignmentId}`));
app.post('/students/assignments/submit', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, '/students/assignments/submit'));
app.get('/students/internal/:id', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, `/students/internal/${req.params.id}`));
app.patch('/students/internal/:id/review', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, `/students/internal/${req.params.id}/review`));
app.get('/students/:id', (req, res) => forwardRequest(req, res, STUDENT_SERVICE_URL, `/students/${req.params.id}`));

app.use((req, res) => {
  return res.status(404).json({ success: false, message: 'Route not found in API Gateway' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});
