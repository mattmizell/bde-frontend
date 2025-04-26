import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function App() {
  const [log, setLog] = useState("Ready to fetch emails...");
  const [processId, setProcessId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputFile, setOutputFile] = useState(null);

  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8010";
        await fetch(`${API_BASE_URL}/start-process`, { method: "POST" })

        if (!response.ok) throw new Error(`Server error: ${response.status} ${response.statusText}`);
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        console.log(`Retrying fetch... Attempt ${i + 1}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const fetchEmails = async () => {
    setLog("Starting email fetch process...");
    setIsLoading(true);
    setProgress(0);
    setOutputFile(null);

    try {
      const data = await fetchWithRetry(`${API_BASE_URL}/start-process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setProcessId(data.process_id);
    } catch (error) {
      console.error("Fetch error:", error);
      setLog(`Failed to start process: ${error.message}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!processId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/status/${processId}`);
        if (!response.ok) throw new Error("Status fetch failed");

        const status = await response.json();
        if (status.status === "done") {
          setLog(`✅ Completed: ${status.row_count} rows parsed.`);
          setOutputFile(status.output_file);
          setIsLoading(false);
          clearInterval(interval);
        } else if (status.status === "error") {
          setLog(`❌ Error: ${status.error}`);
          setIsLoading(false);
          clearInterval(interval);
        } else {
          setLog(`⌛ Processing emails... (${status.current_email} of ${status.email_count})`);
          if (status.email_count > 0) {
            setProgress(Math.round((status.current_email / status.email_count) * 100));
          }
        }
      } catch (err) {
        console.error("Status error:", err);
        setLog(`❌ Status error: ${err.message}`);
        setIsLoading(false);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [processId]);

  return (
    <main className="p-10 text-gray-800 font-sans">
      <h1 className="text-4xl font-bold mb-4">Better Day Energy Parser</h1>

      <button
        onClick={fetchEmails}
        disabled={isLoading}
        className={`bg-white text-black border border-gray-400 px-6 py-3 rounded shadow hover:bg-gray-100 ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isLoading ? "Processing..." : "Fetch Emails"}
      </button>

      <div className="mt-6 text-sm whitespace-pre-wrap">
        {log}
        {progress > 0 && progress < 100 && (
          <div className="mt-2 w-full bg-gray-300 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>

      {outputFile && (
        <div className="mt-6">
          <a
            href={`${API_BASE_URL}/download/${outputFile}`}
            className="text-blue-600 underline hover:text-blue-800"
          >
            📂 Download Output CSV
          </a>
        </div>
      )}
    </main>
  );
}

export default App;
