// App.jsx

import React, { useState, useEffect } from 'react';

function App() {
  const [processId, setProcessId] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const startProcess = async () => {
    try {
      setError(null);
      setStatus('Starting process...');

      const response = await fetch('/api/start-process', { method: 'POST' });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log('Process started:', data);

      if (data.process_id) {
        setProcessId(data.process_id);
        setStatus('Processing started. Monitoring status...');
      } else {
        throw new Error('Invalid response from server.');
      }
    } catch (err) {
      console.error('Error starting process:', err);
      setError('Failed to start processing. Please try again.');
      setStatus(null);
    }
  };

  const checkStatus = async () => {
    try {
      if (!processId) return;

      const response = await fetch(`/api/status/${processId}`);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log('Status:', data);

      if (data.status === 'done') {
        setStatus('Processing complete. Downloading files...');
        if (data.output_file) {
          downloadFile(data.output_file);
        }
        if (data.failed_file) {
          downloadFile(data.failed_file);
        }
        setProcessId(null);
      } else if (data.status === 'processing') {
        setStatus(`Processing... (${data.current_email}/${data.email_count} emails)`);
      } else if (data.status === 'error') {
        setStatus('Error occurred during processing.');
        setError(data.error || 'Unknown error during processing.');
        setProcessId(null);
      }
    } catch (err) {
      console.error('Error checking status:', err);
      setError('Failed to check process status.');
      setProcessId(null);
    }
  };

  const downloadFile = (filename) => {
    const link = document.createElement('a');
    link.href = `/api/download/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!processId) return;

    const interval = setInterval(() => {
      checkStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [processId]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Better Day Energy Parser</h1>
      <button
        onClick={startProcess}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          cursor: 'pointer',
          marginBottom: '1rem',
        }}
      >
        Fetch Emails
      </button>
      <div style={{ marginTop: '1rem' }}>
        {status && <p>Status: {status}</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>
    </div>
  );
}

export default App;
