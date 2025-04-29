import React from "react";
import { useState, useEffect } from "react";
import "./App.css";


function App() {
  const [processId, setProcessId] = useState(null);
  const [status, setStatus] = useState(null);
  const [polling, setPolling] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);
  const [debugLink, setDebugLink] = useState(null);

  const startProcess = async () => {
    setStatus(null);
    setDownloadLink(null);
    setDebugLink(null);

    const response = await fetch("https://bde-project.onrender.com/start-process", {
      method: "POST",
    });

    if (response.ok) {
      const data = await response.json();
      setProcessId(data.process_id);
      setPolling(true);
    } else {
      console.error("Failed to start process");
    }
  };

  useEffect(() => {
    let interval;

    const updateStatus = async () => {
      if (!processId) return;

      const response = await fetch(`https://bde-project.onrender.com/status/${processId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);

        if (data.completed) {
          setPolling(false);
          setDownloadLink(`https://bde-project.onrender.com/download/${data.parsed_file}`);
          setDebugLink(`https://bde-project.onrender.com/download/${data.debug_file}`);
        }
      } else if (response.status === 404) {
        console.error("Status file not found. Stopping polling.");
        setPolling(false);
      } else {
        console.error("Status fetch failed");
      }
    };

    if (polling) {
      interval = setInterval(updateStatus, 3000);
    }

    return () => clearInterval(interval);
  }, [polling, processId]);

  return (
    <div className="container">
      <h1>Better Day Energy Parser</h1>
      <button className="button" onClick={startProcess} disabled={polling}>
        {polling ? "Processing..." : "Start Process"}
      </button>

      {status && (
        <div className="status-card">
          <h2>Status</h2>
          <div className="status-item">
            <span>Emails Fetched:</span>
            <span className="value">{status.emails_fetched}</span>
          </div>
          <div className="status-item">
            <span>Emails Processed:</span>
            <span className="value">{status.emails_processed}</span>
          </div>
          <div className="status-item">
            <span>Parsed Rows:</span>
            <span className="value">{status.parsed_rows}</span>
          </div>
          <div className="status-item">
            <span>Completed:</span>
            <span className="value">{status.completed ? "Yes" : "No"}</span>
          </div>
        </div>
      )}

      {downloadLink && (
        <div className="token-card">
          <h2>Download Files</h2>
          <div className="status-item">
            <span>Parsed CSV:</span>
            <a className="value" href={downloadLink} target="_blank" rel="noopener noreferrer">
              Download
            </a>
          </div>
          <div className="status-item">
            <span>Debug Log:</span>
            <a className="value" href={debugLink} target="_blank" rel="noopener noreferrer">
              Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
