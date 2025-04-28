// server.js
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const API_BASE_URL = 'https://bde-project.onrender.com';

app.use(express.json());

// Serve the static files (React build)
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy for /start-process
app.post('/api/start-process', async (req, res) => {
  console.log('Proxying POST /api/start-process');
  try {
    const response = await fetch(`${API_BASE_URL}/start-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error for /start-process:', error);
    res.status(500).json({ error: 'Failed to start process' });
  }
});

// Proxy for /status/:processId
app.get('/api/status/:processId', async (req, res) => {
  console.log(`Proxying GET /api/status/${req.params.processId}`);
  try {
    const response = await fetch(`${API_BASE_URL}/status/${req.params.processId}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error for /status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Proxy for /download/:filename
app.get('/api/download/:filename', async (req, res) => {
  console.log(`Proxying GET /api/download/${req.params.filename}`);
  try {
    const response = await fetch(`${API_BASE_URL}/download/${req.params.filename}`);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.set('Content-Disposition', `attachment; filename=${req.params.filename}`);
    res.set('Content-Type', 'text/csv');
    res.send(buffer);
  } catch (error) {
    console.error('Proxy error for /download:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Proxy for /keep-alive
app.get('/api/keep-alive', async (req, res) => {
  console.log('Proxying GET /api/keep-alive');
  try {
    const response = await fetch(`${API_BASE_URL}/keep-alive`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error for /keep-alive:', error);
    res.status(500).json({ error: 'Failed to keep alive' });
  }
});

// Fallback to serve the React app for all other routes
app.get('*', (req, res) => {
  console.log('Serving React app for', req.url);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Frontend proxy server running on port ${port}`);
});