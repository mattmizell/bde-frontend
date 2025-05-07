import React, { useState } from "react";
import axios from "axios";
import StatusViewer from "./components/StatusViewer";
import LiveLogViewer from "./components/LiveLogViewer";

function App() {
  const [processId, setProcessId] = useState(null);
  const [status, setStatus] = useState(null);
  const [selectedModel, setSelectedModel] = useState("grok-3");

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

      {status && <StatusViewer status={status} />}
      {processId && <LiveLogViewer processId={processId} />}
    </div>
  );
}

export default App;
