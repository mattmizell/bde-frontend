// server.js (in project root)
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer'; // Explicitly import Buffer for ESM

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const API_BASE_URL = 'https://bde-project.onrender.com';

app.use(express.json());

// Serve the static files (React build)
app.use(express.static(path.join(__dirname, 'dist')));

// Debug endpoint to confirm proxy server is running
app.get('/debug', (req, res) => {
  console.log('Received GET /debug');
  res.json({ message: 'Proxy server is running' });
});

// Helper function to handle proxy requests and responses
const handleProxyRequest = async (url, method = 'GET', req = null) => {
  console.log(`Proxying ${method} ${url}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(method === 'POST' && req ? { body: JSON.stringify(req.body) } : {}),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log(`Backend response status: ${response.status}`);
    console.log(`Backend response headers: ${JSON.stringify([...response.headers])}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error response: ${errorText}`);
      return { error: `Backend responded with status ${response.status}: ${errorText}` };
    }

    const responseText = await response.text();
    console.log(`Backend raw response: "${responseText}"`);

    if (!responseText) {
      return { error: 'Backend returned an empty response' };
    }

    try {
      const data = JSON.parse(responseText);
      console.log('Successfully parsed backend response:', data);
      return { data };
    } catch (parseError) {
      console.error('Failed to parse backend response as JSON:', parseError.message);
      console.error('Raw response for debugging:', responseText);
      return { error: 'Invalid JSON response from backend' };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Fetch error for ${url}:`, error.message);
    return { error: `Fetch failed: ${error.message}` };
  }
};

// Proxy for /start-process
app.post('/api/start-process', async (req, res) => {
  const result = await handleProxyRequest(`${API_BASE_URL}/start-process`, 'POST', req);
  if (result.error) {
    res.status(500).json({ error: 'Failed to start process', details: result.error });
    console.log('Error response sent to frontend:', { error: 'Failed to start process', details: result.error });
    return;
  }
  res.set('Content-Type', 'application/json');
  res.status(200).json(result.data);
  console.log('Response sent to frontend:', result.data);
});

// Proxy for /status/:processId
app.get('/api/status/:processId', async (req, res) => {
  const result = await handleProxyRequest(`${API_BASE_URL}/status/${req.params.processId}`);
  if (result.error) {
    res.status(500).json({ error: 'Failed to get status', details: result.error });
    console.log('Error response sent to frontend:', { error: 'Failed to get status', details: result.error });
    return;
  }
  res.set('Content-Type', 'application/json');
  res.status(200).json(result.data);
  console.log('Response sent to frontend:', result.data);
});

// Proxy for /download/:filename
app.get('/api/download/:filename', async (req, res) => {
  console.log(`Proxying GET /api/download/${req.params.filename}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
  try {
    const response = await fetch(`${API_BASE_URL}/download/${req.params.filename}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log(`Backend response status: ${response.status}`);
    console.log(`Backend response headers: ${JSON.stringify([...response.headers])}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error response: ${errorText}`);
      res.status(500).json({ error: 'Failed to download file', details: `Backend responded with status ${response.status}: ${errorText}` });
      console.log('Error response sent to frontend:', { error: 'Failed to download file', details: `Backend responded with status ${response.status}: ${errorText}` });
      return;
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.set('Content-Disposition', `attachment; filename=${req.params.filename}`);
    res.set('Content-Type', 'text/csv');
    res.send(buffer);
    console.log(`Download response sent for ${req.params.filename}`);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Proxy error for /download:', error.message);
    res.status(500).json({ error: 'Failed to download file', details: error.message });
    console.log('Error response sent to frontend:', { error: 'Failed to download file', details: error.message });
  }
});

// Proxy for /keep-alive
app.get('/api/keep-alive', async (req, res) => {
  const result = await handleProxyRequest(`${API_BASE_URL}/keep-alive`);
  if (result.error) {
    res.status(500).json({ error: 'Failed to keep alive', details: result.error });
    console.log('Error response sent to frontend:', { error: 'Failed to keep alive', details: result.error });
    return;
  }
  res.set('Content-Type', 'application/json');
  res.status(200).json(result.data);
  console.log('Response sent to frontend:', result.data);
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