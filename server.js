// server.js (in project root)
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
    console.log(`Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error response: ${errorText}`);
      throw new Error(`Backend responded with status ${response.status}: ${errorText}`);
    }

    const responseText = await response.text();
    console.log(`Backend raw response: ${responseText}`);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse backend response as JSON:', parseError.message);
      throw new Error('Invalid JSON response from backend');
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error for /start-process:', error.message);
    res.status(500).json({ error: 'Failed to start process', details: error.message });
  }
});

// Proxy for /status/:processId
app.get('/api/status/:processId', async (req, res) => {
  console.log(`Proxying GET /api/status/${req.params.processId}`);
  try {
    const response = await fetch(`${API_BASE_URL}/status/${req.params.processId}`);
    console.log(`Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error response: ${errorText}`);
      throw new Error(`Backend responded with status ${response.status}: ${errorText}`);
    }

    const responseText = await response.text();
    console.log(`Backend raw response: ${responseText}`);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse backend response as JSON:', parseError.message);
      throw new Error('Invalid JSON response from backend');
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error for /status:', error.message);
    res.status(500).json({ error: 'Failed to get status', details: error.message });
  }
});

// Proxy for /download/:filename
app.get('/api/download/:filename', async (req, res) => {
  console.log(`Proxying GET /api/download/${req.params.filename}`);
  try {
    const response = await fetch(`${API_BASE_URL}/download/${req.params.filename}`);
    console.log(`Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error response: ${errorText}`);
      throw new Error(`Backend responded with status ${response.status}: ${errorText}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.set('Content-Disposition', `attachment; filename=${req.params.filename}`);
    res.set('Content-Type', 'text/csv');
    res.send(buffer);
  } catch (error) {
    console.error('Proxy error for /download:', error.message);
    res.status(500).json({ error: 'Failed to download file', details: error.message });
  }
});

// Proxy for /keep-alive
app.get('/api/keep-alive', async (req, res) => {
  console.log('Proxying GET /api/keep-alive');
  try {
    const response = await fetch(`${API_BASE_URL}/keep-alive`);
    console.log(`Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error response: ${errorText}`);
      throw new Error(`Backend responded with status ${response.status}: ${errorText}`);
    }

    const responseText = await response.text();
    console.log(`Backend raw response: ${responseText}`);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse backend response as JSON:', parseError.message);
      throw new Error('Invalid JSON response from backend');
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error for /keep-alive:', error.message);
    res.status(500).json({ error: 'Failed to keep alive', details: error.message });
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