import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [status, setStatus] = useState(null);
  const [processId, setProcessId] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("grok-3");
  const [logVisible, setLogVisible] = useState(false);
  const [logContent, setLogContent] = useState("");

  const startProcess = async () => {
    try {
      const response = await axios.post(
        `https://bde-project.onrender.com/start-process?model=${selectedModel}`
      );
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
      const response = await axios.get(
        `https://bde-project.onrender.com/status/${id}`
      );
      const data = response.data;
      setStatus(data);
      if (data.status === "done" || data.status === "error") {
        clearInterval(window.poller);
        clearInterval(window.logPoller);
      }
    } catch (err) {
      console.log("Status file not found. Stopping polling.");
      clearInterval(window.poller);
      clearInterval(window.logPoller);
    }
  };

  const pollLog = async () => {
    if (!status?.debug_log) {
      setLogContent("Waiting for debug log to become available...");
      return;
    }

    try {
      const response = await axios.get(
        `https://bde-project.onrender.com/log/${status.debug_log}`
      );
      setLogContent(response.data);
    } catch (err) {
      setLogContent("Log could not be loaded.");
    }
  };

  const downloadCSV = async () => {
    if (!status?.output_file) return;
    try {
      setDownloading(true);
      const response = await axios.get(
        `https://bde-project.onrender.com/download/${status.output_file}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", status.output_file);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(async () => {
        try {
          await axios.post(
            `https://bde-project.onrender.com/cleanup/${processId}`
          );
        } catch (err) {
          console.error("Cleanup failed:", err);
        }
      }, 5000);

      setDownloading(false);
    } catch (err) {
      setDownloading(false);
      alert("Download failed or file not available.");
    }
  };

  const downloadLog = async () => {
    if (!processId) return;
    try {
      const response = await axios.get(
        `https://bde-project.onrender.com/log/${processId}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `debug_${processId}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Log download failed.");
    }
  };

  useEffect(() => {
    if (processId) {
      window.poller = setInterval(() => pollStatus(processId), 3000);
      window.logPoller = setInterval(() => pollLog(), 3000);
    }
    return () => {
      clearInterval(window.poller);
      clearInterval(window.logPoller);
    };
  }, [processId]);

  useEffect(() => {
    const pre = document.querySelector("pre");
    if (pre) pre.scrollTop = pre.scrollHeight;
  }, [logContent]);

  return (
    <div className="panel font-sans text-white">
      <h1 className="text-2xl font-bold mb-4 text-center text-cyan-400 uppercase tracking-wide">
        BDE Petroleum Pricing Parser
      </h1>

      <div className="mb-4">
        <label htmlFor="model" className="block text-sm font-medium mb-1">
          Select AI Model:
        </label>
        <select
          id="model"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="border border-gray-600 rounded px-3 py-2 w-full bg-black text-white"
        >
          <option value="grok-3">grok-3</option>
          <option value="grok-3-fast">grok-3-fast</option>
          <option value="grok-3-mini">grok-3-mini</option>
          <option value="grok-3-mini-fast">grok-3-mini-fast</option>
        </select>
      </div>

      <button
        onClick={startProcess}
        className="bg-cyan-600 text-white px-4 py-2 rounded shadow mb-4 hover:bg-cyan-700"
      >
        Start Parsing
      </button>

      {status && (
        <div className="mb-4 p-4 bg-gray-800 rounded">
          <p><strong>Status:</strong> {status.status}</p>
          <p><strong>Emails Fetched:</strong> {status.email_count}</p>
          <p><strong>Current Email:</strong> {status.current_email}</p>
          <p><strong>Rows Parsed:</strong> {status.row_count}</p>
          <p><strong>Output:</strong> {status.output_file || "(none)"} </p>
        </div>
      )}

      {(status?.status === "done" || status?.status === "error") && (
        <div className="flex flex-col gap-2 mt-4">
          {status?.output_file && status?.row_count > 0 && (
            <button
              onClick={downloadCSV}
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
              disabled={downloading}
            >
              {downloading ? "Downloading..." : "Download CSV"}
            </button>
          )}
          <button
            onClick={downloadLog}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Download Debug Log
          </button>
        </div>
      )}

      {status?.status === "done" && status?.row_count === 0 && (
        <div className="text-red-400 font-semibold">
          No rows parsed. Check logs or try different emails.
        </div>
      )}

      <button
        className="mt-6 mb-2 underline text-cyan-400 hover:text-cyan-200 text-sm"
        onClick={() => setLogVisible(!logVisible)}
      >
        {logVisible ? "Hide Log Output" : "Show Log Output"}
      </button>

      {logVisible && (
        <pre className="bg-black p-4 rounded text-green-400 max-h-80 overflow-auto text-xs border border-cyan-700">
          {logContent || "Loading log..."}
        </pre>
      )}
    </div>
  );
}

export default App;
