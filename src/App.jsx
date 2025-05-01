import React, { useState, useEffect } from "react";
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

  const handleCleanup = async (id) => {
    try {
      await fetch(`https://bde-project.onrender.com/cleanup/${id}`, {
        method: "POST",
      });
      console.log("✅ Cleanup complete");
    } catch (err) {
      console.error("⚠️ Cleanup failed:", err);
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

        if (data.status === "done" || data.status === "error") {
          setPolling(false);
          setDownloadLink(`https://bde-project.onrender.com/download/${data.output_file}`);
          setDebugLink(`https://bde-project.onrender.com/download/${data.debug_log}`);
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
            <span className="value">{status.email_count}</span>
          </div>
          <div className="status-item">
            <span>Emails Processed:</span>
            <span className="value">{status.current_email}</span>
          </div>
          <div className="status-item">
            <span>Parsed Rows:</span>
            <span className="value">{status.row_count}</span>
          </div>
          <div className="status-item">
            <span>Status:</span>
            <span className="value">{status.status}</span>
          </div>
        </div>
      )}

      {downloadLink && (
        <div className="token-card">
          <h2>Download Files</h2>
          <div className="status-item">
            <span>Parsed CSV:</span>
            <a
              className="value"
              href={downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleCleanup(processId)}
            >
              Download
            </a>
          </div>
          <div className="status-item">
            <span>Debug Log:</span>
            <a
              className="value"
              href={debugLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
