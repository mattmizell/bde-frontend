// server.js

const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// API Base URL (backend FastAPI server)
const API_BASE_URL = 'https://bde-project.onrender.com'; // your backend server

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Helper to proxy API requests
async function handleProxyRequest(url, method = 'GET', req = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (req && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data };
    } else {
      const text = await response.text();
      console.error('Non-JSON response from backend:', text);
      return { error: 'Backend did not return JSON', details: text };
    }
  } catch (error) {
    console.error('Error proxying request:', error);
    return { error: error.message };
  }
}

// Proxy POST to /start-process
app.post('/api/start-process', async (req, res) => {
  const result = await handleProxyRequest(`${API_BASE_URL}/start-process`, 'POST', req);
  if (result.error) {
    res.status(500).json({ error: 'Failed to start process', details: result.error });
    return;
  }
  if (!result.data) {
    res.status(500).json({ error: 'No data received from backend' });
    return;
  }
  res.set('Content-Type', 'application/json');
  res.status(200).json(result.data);
});

// Proxy GET to /status/:process_id
app.get('/api/status/:process_id', async (req, res) => {
  const { process_id } = req.params;
  const result = await handleProxyRequest(`${API_BASE_URL}/status/${process_id}`);
  if (result.error) {
    res.status(500).json({ error: 'Failed to fetch status', details: result.error });
    return;
  }
  res.set('Content-Type', 'application/json');
  res.status(200).json(result.data);
});

// Proxy GET to /download/:filename
app.get('/api/download/:filename', async (req, res) => {
  const { filename } = req.params;
  try {
    const response = await fetch(`${API_BASE_URL}/download/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    response.body.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle SPA routing fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
