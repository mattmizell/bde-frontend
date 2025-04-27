import React, { useState, useEffect } from "react";

const API_BASE_URL = "https://bde-project.onrender.com";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [processId, setProcessId] = useState(null);
  const [log, setLog] = useState("");

  useEffect(() => {
    let interval;
    if (processId) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/status/${processId}`, {
            credentials: "include",
          });
          if (!response.ok) {
            throw new Error("Failed to fetch status");
          }
          const status = await response.json();

          if (status.status === "done") {
            setLog(`✅ Completed: ${status.row_count} rows parsed.`);
            setIsLoading(false);

            // Immediately download parsed CSV
            autoDownloadFile(status.output_file);

            // Also try to download failed CSV if exists
            const failedFilename = "failed_" + status.output_file.split("_")[1];
            autoDownloadFile(failedFilename);

            clearInterval(interval);
          } else if (status.status === "error") {
            setLog(`❌ Error: ${status.error}`);
            setIsLoading(false);
            clearInterval(interval);
          } else {
            setLog(
              `📩 Emails Found: ${status.email_count} | 📨 Processing: ${status.current_email} | ✅ Rows Parsed: ${status.row_count}`
            );
          }
        } catch (error) {
          console.error("Error checking status:", error);
          setLog(`❌ Error checking status`);
          setIsLoading(false);
          clearInterval(interval);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [processId]);

  const fetchWithRetry = async (url, options = {}, retries = 3, delay = 2000) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(url, options, retries - 1, delay);
        } else {
          throw new Error(`Failed after ${retries} retries`);
        }
      }
      return response;
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay);
      } else {
        throw error;
      }
    }
  };

  const handleFetchEmails = async () => {
    try {
      setIsLoading(true);
      setLog("⏳ Starting to fetch emails...");
      setProcessId(null);

      const response = await fetchWithRetry(`${API_BASE_URL}/start-process`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      setProcessId(data.process_id);
    } catch (error) {
      console.error("Error starting process:", error);
      setLog(`❌ Error starting process`);
      setIsLoading(false);
    }
  };

  const autoDownloadFile = async (filename) => {
    try {
      const response = await fetch(`${API_BASE_URL}/download/${filename}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch file");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Auto download error:", error);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>BDE Email Parser</h1>

      <button
        onClick={handleFetchEmails}
        disabled={isLoading}
        style={{
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: isLoading ? "not-allowed" : "pointer",
          fontSize: "16px",
        }}
      >
        {isLoading ? "Processing..." : "Fetch Emails"}
      </button>

      <div style={{ marginTop: "20px" }}>
        <h3>Status:</h3>
        <p>{log}</p>
      </div>
    </div>
  );
}

export default App;
