import React, { useState } from "react";
import axios from "axios";
import LiveLogViewer from "./components/LogViewer";

function App() {
  const [processId, setProcessId] = useState(null);
  const [status, setStatus] = useState(null);
  const [selectedModel, setSelectedModel] = useState("grok-3");
  const [downloading, setDownloading] = useState(false);

  const startProcess = async () => {
    try {
      const response = await axios.post(
        `https://bde-project.onrender.com/start-process?model=${selectedModel}`
      );
      const { process_id } = response.data;
      setProcessId(process_id);
      setStatus(null);
      pollStatus(process_id);
    } catch (error) {
      console.error("Failed to start process:", error);
    }
  };

  const pollStatus = (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `https://bde-project.onrender.com/status/${id}`
        );
        const newStatus = response.data;
        setStatus(newStatus);

        if (newStatus.status === "complete" || newStatus.status === "error") {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    }, 3000);
  };

  const downloadCSV = async () => {
    if (!status?.output_file) return;
    setDownloading(true);
    try {
      const response = await axios.get(
        `https://bde-project.onrender.com/download/${status.output_file}`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = status.output_file;
      a.click();
      window.URL.revokeObjectURL(url);

      // Optional: Cleanup the backend status
      await axios.post(
        `https://bde-project.onrender.com/cleanup/${processId}`
      );
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download CSV. Please check logs.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-start p-6 space-y-6">
      <h1 className="text-3xl font-bold text-cyan-400 mb-2">
        🛢️ BDE Price Parser
      </h1>
      <div className="flex space-x-4 items-center">
        <label htmlFor="model" className="text-cyan-300">
          Select Model:
        </label>
        <select
          id="model"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="p-2 bg-gray-800 border border-cyan-500 rounded"
        >
          <option value="grok-3">Grok 3</option>
          <option value="grok-mini">Grok Mini</option>
          <option value="openai">OpenAI GPT-4</option>
        </select>
        <button
          onClick={startProcess}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded shadow"
        >
          Fetch & Parse
        </button>
      </div>

      {status && (
        <div className="mb-4 p-4 bg-gray-800 rounded border border-cyan-500 w-full max-w-2xl">
          <p><strong>Status:</strong> {status.status}</p>
          <p><strong>Emails Fetched:</strong> {status.email_count}</p>
          <p><strong>Current Email:</strong> {status.current_email}</p>
          <p><strong>Rows Parsed:</strong> {status.row_count}</p>
          <p><strong>Output:</strong> {status.output_file || "(none)"}</p>
        </div>
      )}

      {status?.status === "complete" && status?.row_count > 0 && (
        <button
          onClick={downloadCSV}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          disabled={downloading}
        >
          {downloading ? "Downloading..." : "Download CSV"}
        </button>
      )}

      {status?.status === "complete" && status?.row_count === 0 && (
        <div className="text-red-400 font-semibold">
          No rows parsed. Check logs or try different emails.
        </div>
      )}

      {processId && <LiveLogViewer processId={processId} />}
    </div>
  );
}

export default App;
