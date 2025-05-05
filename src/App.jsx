
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [emailsFetched, setEmailsFetched] = useState(0);
  const [emailsParsed, setEmailsParsed] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    // Simulate data polling every 2 seconds
    const interval = setInterval(() => {
      setEmailsFetched(prev => Math.min(prev + 1, 10));
      setEmailsParsed(prev => Math.min(prev + 1, 10));
      setTotalRows(prev => prev + Math.floor(Math.random() * 10));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const progressPercent = emailsFetched > 0 ? (emailsParsed / emailsFetched) * 100 : 0;

  return (
    <div className="container">
      <header>BDE Petroleum Pricing Parser</header>
      <div>
        <p><strong>Emails Fetched:</strong> {emailsFetched}</p>
        <p><strong>Emails Parsed:</strong> {emailsParsed}</p>
        <p><strong>Total Parsed Rows:</strong> {totalRows}</p>
        <div className="status-bar">
          <div className="status-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>
    </div>
  );
}

export default App;
