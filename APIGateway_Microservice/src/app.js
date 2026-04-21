const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const {
  AUTH_SERVICE_URL,
  STUDENT_SERVICE_URL,
  TEACHER_SERVICE_URL
} = require('./config/env');

const app = express();

app.use(cors());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'api-gateway',
    upstreams: {
      auth: AUTH_SERVICE_URL,
      student: STUDENT_SERVICE_URL,
      teacher: TEACHER_SERVICE_URL
    }
  });
});

const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  logLevel: 'warn',
  onProxyReq: (proxyReq, req) => {
    if (req.headers.authorization) {
      proxyReq.setHeader('authorization', req.headers.authorization);
    }
  },
  onError: (err, req, res) => {
    console.error(`Proxy error -> ${target}: ${err.message}`);
    if (!res.headersSent) {
      res.status(502).json({
        success: false,
        message: `Upstream service unavailable: ${target}`
      });
    }
  }
});

app.use('/auth', createProxyMiddleware({ ...proxyOptions(AUTH_SERVICE_URL), pathRewrite: { '^/auth': '/auth' } }));
app.use('/students', createProxyMiddleware({ ...proxyOptions(STUDENT_SERVICE_URL), pathRewrite: { '^/students': '/students' } }));
app.use('/teachers', createProxyMiddleware({ ...proxyOptions(TEACHER_SERVICE_URL), pathRewrite: { '^/teachers': '/teachers' } }));

app.use((req, res) =>
  res.status(404).json({ success: false, message: 'Route not found in API Gateway' })
);

module.exports = app;
