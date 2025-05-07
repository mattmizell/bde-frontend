import React, { useEffect, useState, useRef } from "react";

const LogViewer = ({ processId }) => {
  const [logContent, setLogContent] = useState("Waiting for process to start...");
  const intervalRef = useRef(null);
  const logBoxRef = useRef(null);

  useEffect(() => {
    if (!processId) return;

    const fetchLog = async () => {
      try {
        const response = await fetch(`https://bde-project.onrender.com/log/${processId}`);
        const data = await response.json();
        if (data.log) setLogContent(data.log);
      } catch (err) {
        setLogContent(`⚠️ Failed to fetch log for process ${processId}`);
      }
    };

    // Start polling every 3 seconds
    intervalRef.current = setInterval(fetchLog, 3000);
    fetchLog(); // initial fetch

    return () => clearInterval(intervalRef.current);
  }, [processId]);

  // Auto-scroll to bottom on new log
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logContent]);

  return (
    <div className="bg-gray-900 text-green-300 p-4 rounded-xl mt-4 max-h-[500px] overflow-y-auto font-mono text-sm shadow-md border border-blue-600" ref={logBoxRef}>
      <pre>{logContent}</pre>
    </div>
  );
};

export default LogViewer;
