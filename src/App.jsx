import React, { useState, useEffect } from "react";
import "./App.css";

const BASE_URL = "https://bde-project.onrender.com"; // Your backend URL

const App = () => {
  const [processId, setProcessId] = useState(null);
  const [status, setStatus] = useState({
    status: "Idle",
    email_count: 0,
    current_email: 0,
    row_count: 0,
    output_file: null,
    debug_log: null,
    remaining_requests: "Unknown",
    total_requests: "Unknown",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const startProcess = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${BASE_URL}/start-process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to start process");
      const data = await response.json();
      setProcessId(data.process_id);
    } catch (error) {
      console.error("Error starting process:", error);
      setStatus((prev) => ({ ...prev, status: "Error" }));
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!processId) return;

    const pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(`${BASE_URL}/status/${processId}`);
        if (!response.ok) {
          if (response.status === 404) {
            clearInterval(pollingInterval);
            return;
          }
          throw new Error("Failed to fetch status");
        }
        const data = await response.json();
        setStatus(data);

        if (data.status === "done" || data.status === "error") {
          clearInterval(pollingInterval);
          setIsProcessing(false);
        }
      } catch (error) {
        console.error("Error polling status:", error);
        setStatus((prev) => ({ ...prev, status: "Error" }));
        clearInterval(pollingInterval);
        setIsProcessing(false);
      }
    }, 1000);

    return () => clearInterval(pollingInterval);
  }, [processId]);

  const progress = status.email_count > 0 ? (status.current_email / status.email_count) * 100 : 0;
  const isLowTokens =
    status.remaining_requests !== "Unknown" &&
    status.total_requests !== "Unknown" &&
    (parseInt(status.remaining_requests) / parseInt(status.total_requests)) * 100 < 10;

  return (
    <div className="container">
      <h1>BDE Email Parser</h1>
      <button className="button" onClick={startProcess} disabled={isProcessing}>
        {isProcessing ? "Fetching..." : "Fetch Emails"}
      </button>

      <div className="status-card">
        <h2>Processing Status</h2>
        <div className="status-item">
          <span>Status:</span>
          <span className="value">{status.status.charAt(0).toUpperCase() + status.status.slice(1)}</span>
        </div>
        <div className="status-item">
          <span>Emails Fetched:</span>
          <span className="value">{status.email_count}</span>
        </div>
        <div className="status-item">
          <span>Emails Processed:</span>
          <span className="value">{`${status.current_email} of ${status.email_count}`}</span>
        </div>
        <div className="status-item">
          <span>Rows Parsed:</span>
          <span className="value">{status.row_count}</span>
        </div>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className={`token-card ${isLowTokens ? "warning" : ""}`}>
        <h2>API Token Status</h2>
        <div className="status-item">
          <span>Requests Remaining:</span>
          <span className={`value ${isLowTokens ? "warning" : ""}`}>{status.remaining_requests}</span>
        </div>
        <div className="status-item">
          <span>Total Requests:</span>
          <span className="value">{status.total_requests}</span>
        </div>
        {isLowTokens && (
          <button
            className="top-up-button"
            onClick={() => (window.location.href = "https://x.ai/account")}
          >
            Top Up Tokens
          </button>
        )}
      </div>

      {status.status === "done" && status.output_file && (
        <div className="download-links">
          <a href={`${BASE_URL}/download/${status.output_file}`}>Download CSV</a>
          <a href={`${BASE_URL}/download/${status.debug_log}`}>Download Debug Log</a>
        </div>
      )}
    </div>
  );
};

export default App;