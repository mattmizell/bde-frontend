// server.js

const express = require('express');
const path = require('path');
const proxy = require('express-http-proxy');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = 'https://bde-project.onrender.com';

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy /api requests to backend
app.use('/api', proxy(API_BASE_URL, {
  proxyReqPathResolver: (req) => req.originalUrl.replace('/api', ''),
}));

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
