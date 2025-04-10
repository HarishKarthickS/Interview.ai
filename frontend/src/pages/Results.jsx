import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const Results = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const answers = location.state?.answers || [];
  
  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };
  
  if (answers.length === 0) {
    return (
      <div className={`results-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
        <div className="results-header">
          <h1 className="results-title">Interview Results</h1>
          <div className="header-actions">
            <Link to="/" className="back-link">
              ← Back to Interview
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="loading">
          <p>No interview results found. Please complete an interview first.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`results-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
      <div className="results-header">
        <h1 className="results-title">Interview Results</h1>
        <div className="header-actions">
          <button className="print-button" onClick={handlePrint}>
            🖨️ Print Results
          </button>
          <Link to="/" className="back-link" style={{ marginLeft: '1rem' }}>
            ← Back to Interview
          </Link>
          <ThemeToggle />
        </div>
      </div>
      
      <div className="results-list">
        {answers.map((item, index) => (
          <div key={index} className="result-item">
            <div className="result-question">
              Q{index + 1}: {item.question}
            </div>
            <div className="result-answer">
              {item.answer || "No answer provided"}
            </div>
            <div className="result-meta">
              <span>
                <span className="meta-label">Duration:</span> 
                {formatDuration(item.duration || 0)}
              </span>
              <span>
                <span className="meta-label">Word count:</span> 
                {item.answer ? item.answer.split(/\s+/).filter(Boolean).length : 0}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="results-summary">
        <h2>Interview Summary</h2>
        <div className="summary-stats">
          <div className="summary-stat">
            <div className="stat-value">{answers.length}</div>
            <div className="stat-label">Questions Answered</div>
          </div>
          
          <div className="summary-stat">
            <div className="stat-value">
              {formatDuration(answers.reduce((total, item) => total + (item.duration || 0), 0))}
            </div>
            <div className="stat-label">Total Duration</div>
          </div>
          
          <div className="summary-stat">
            <div className="stat-value">
              {answers.reduce((total, item) => total + (item.answer ? item.answer.split(/\s+/).filter(Boolean).length : 0), 0)}
            </div>
            <div className="stat-label">Total Words</div>
          </div>
        </div>
      </div>
      
      <div className="footer">
        <p>© {new Date().getFullYear()} Interview Assistant</p>
      </div>
    </div>
  );
};

export default Results; 