// server.js

const express = require('express');
const path = require('path');
const proxy = require('express-http-proxy');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// API Base URL (backend FastAPI server)
const API_BASE_URL = 'https://bde-project.onrender.com';

// Static files
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy API requests
app.use('/api', proxy(API_BASE_URL, {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace('/api', '');
  },
}));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
