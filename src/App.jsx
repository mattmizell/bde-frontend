import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";


function App() {
  const [status, setStatus] = useState(null);
  const [processId, setProcessId] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("grok-3");

  const startProcess = async () => {
    try {
      const response = await axios.post(`https://bde-project.onrender.com/start-process?model=${selectedModel}`);
      const { process_id } = response.data;
      setProcessId(process_id);
      setStatus({ status: "starting..." });
    } catch (err) {
      alert("Failed to start process");
      console.error(err);
    }
  };

  const pollStatus = async (id) => {
    try {
      const response = await axios.get(`https://bde-project.onrender.com/status/${id}`);
      const data = response.data;
      setStatus(data);
      if (data.status === "done" || data.status === "error") {
        clearInterval(window.poller);
      }
    } catch (err) {
      console.log("Status file not found. Stopping polling.");
      clearInterval(window.poller);
    }
  };

  const downloadCSV = async () => {
    if (!status?.output_file) return;
    try {
      setDownloading(true);
      const response = await axios.get(`https://bde-project.onrender.com/download/${status.output_file}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", status.output_file);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await axios.post(`https://bde-project.onrender.com/cleanup/${processId}`);
      setDownloading(false);
    } catch (err) {
      setDownloading(false);
      alert("Download failed or file not available.");
    }
  };

  useEffect(() => {
    if (processId) {
      window.poller = setInterval(() => pollStatus(processId), 2000);
    }
    return () => clearInterval(window.poller);
  }, [processId]);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Better Day Energy Pricing Parser</h1>

      <div className="mb-4">
        <label htmlFor="model" className="block text-sm font-medium mb-1">
          Select AI Model:
        </label>
        <select
          id="model"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="border rounded p-2 w-full"
        >
          <option value="grok-3">grok-3</option>
          <option value="grok-3-mini">grok-3-mini</option>
        </select>
      </div>

      <button
        onClick={startProcess}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow mb-4 hover:bg-blue-700"
      >
        Start Parsing
      </button>

      {status && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <p><strong>Status:</strong> {status.status}</p>
          <p><strong>Emails Fetched:</strong> {status.email_count}</p>
          <p><strong>Current Email:</strong> {status.current_email}</p>
          <p><strong>Rows Parsed:</strong> {status.row_count}</p>
          <p><strong>Output:</strong> {status.output_file || "(none)"}</p>
        </div>
      )}

      {status?.status === "done" && status?.output_file && status?.row_count > 0 && (
        <button
          onClick={downloadCSV}
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          disabled={downloading}
        >
          {downloading ? "Downloading..." : "Download CSV"}
        </button>
      )}

      {status?.status === "done" && status?.row_count === 0 && (
        <div className="text-red-600 font-semibold">No rows parsed. Check logs or try different emails.</div>
      )}
    </div>
  );
}

export default App;
