import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'; // Added useNavigate
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { getInterviewById, deleteInterview } from '../utils/api'; // Import API functions
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons'; // Added faTrash

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate(); // Added useNavigate
  const { theme } = useTheme();
  // const params = useParams(); 

  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false); // Added state for delete loading
  
  useEffect(() => {
    const fetchResults = async () => {
      setError(null); // Clear error on re-fetch or state change
      let idToFetch = null;

      if (location.state?.interviewId) {
        idToFetch = location.state.interviewId;
      }
      // Example: If ID was in URL like /results/:id
      // else if (params.interviewId) { 
      //   idToFetch = params.interviewId;
      // }

      if (location.state?.answers && idToFetch) {
        // Data passed via state, use it directly but structure it like API response
        // Assuming location.state.answers is an array of { question, answer, duration }
        // And API returns { transcript: [{ questionText, answerText, durationSeconds }], ...otherInterviewFields }
        setInterviewData({
          _id: idToFetch,
          transcript: location.state.answers.map(a => ({
            questionText: a.question,
            answerText: a.answer,
            durationSeconds: a.duration,
          })),
          // Potentially other fields if passed, like llmFeedback, cvAnalysis, finalScore
          llmFeedback: location.state.llmFeedback, 
          cvAnalysis: location.state.cvAnalysis,
          finalScore: location.state.finalScore,
          timestamp: location.state.timestamp || new Date().toISOString(), // Add timestamp if available
        });
        setLoading(false);
      } else if (idToFetch) {
        try {
          setError(null); // Clear previous errors
          const data = await getInterviewById(idToFetch);
          setInterviewData(data);
        } catch (err) {
          console.error("Error fetching interview data:", err);
          setError(err.message || 'Failed to fetch interview data. Please ensure the ID is correct or try again later.');
        } finally {
          setLoading(false);
        }
      } else {
        setError('No interview ID found. Cannot fetch results.');
        setLoading(false);
      }
    };

    fetchResults();
  }, [location.state]); // Rerun if location.state changes

  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };

  const handleDeleteInterview = async () => {
    if (!interviewData || !interviewData._id) {
      setError("No interview loaded or interview ID missing. Cannot delete.");
      // Or use a toast: showToast("No interview loaded or interview ID missing.", "error");
      return;
    }

    if (window.confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      setIsLoadingDelete(true);
      setError(null);
      try {
        await deleteInterview(interviewData._id);
        // showToast("Interview deleted successfully.", "success"); // If using a global toast system
        alert("Interview deleted successfully."); // Simple alert for now
        navigate('/'); // Redirect to home or another appropriate page
      } catch (err) {
        console.error("Error deleting interview:", err);
        setError(`Failed to delete interview. ${err.message || ''}`);
        // showToast(`Failed to delete interview. ${err.message || ''}`, "error");
      } finally {
        setIsLoadingDelete(false);
      }
    }
  };

  if (loading) {
    return (
      <div className={`results-container ${theme === 'dark' ? 'dark-mode' : ''} loading-state`}>
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p>Loading interview results...</p>
      </div>
    );
  }

  // Error display handles both fetch and delete errors
  if (error) {
    return (
      <div className={`results-container ${theme === 'dark' ? 'dark-mode' : ''} error-state`}>
        <div className="results-header">
          <h1 className="results-title">Interview Results</h1>
          <div className="header-actions">
            <Link to="/" className="back-link">
              ← Back to Interview Setup
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <p className="error-message">Error: {error}</p>
        <p>Please try returning to the interview setup page, check your connection, or try again.</p>
      </div>
    );
  }

  if (!interviewData || !interviewData.transcript || interviewData.transcript.length === 0) {
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
        <div className="empty-results">
          <p>No interview results found. Please complete an interview first or ensure you have navigated here from an interview session.</p>
        </div>
      </div>
    );
  }
  
  // Use interviewData.transcript for rendering
  const transcriptItems = interviewData.transcript;

  return (
    <div className={`results-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
      <div className="results-header">
        <h1 className="results-title">Interview Results</h1>
        <div className="header-actions">
          <button 
            className="print-button" 
            onClick={handlePrint}
            disabled={isLoadingDelete} // Disable if delete is in progress
          >
            🖨️ Print Results
          </button>
          <button 
            className="delete-button" 
            onClick={handleDeleteInterview}
            disabled={isLoadingDelete || !interviewData || !interviewData._id}
            style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }} // Basic spacing
          >
            {isLoadingDelete ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Deleting...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faTrash} /> Delete Interview
              </>
            )}
          </button>
          <Link 
            to="/" 
            className="back-link" 
            style={{ pointerEvents: isLoadingDelete ? 'none' : 'auto' }} // Prevent navigation during delete
          >
            ← Back to Interview
          </Link>
          <ThemeToggle />
        </div>
      </div>
      
      {/* Displaying other interview data if available */}
      {interviewData.finalScore !== undefined && (
        <div className="final-score-section">
          <h2>Overall Score: {interviewData.finalScore}/100</h2> 
        </div>
      )}

      {interviewData.llmFeedback && typeof interviewData.llmFeedback === 'object' && Object.keys(interviewData.llmFeedback).length > 0 && (
        <div className="feedback-section">
          <h3>AI Feedback:</h3>
          <pre>{JSON.stringify(interviewData.llmFeedback, null, 2)}</pre>
        </div>
      )}
      
      {interviewData.cvAnalysis && typeof interviewData.cvAnalysis === 'object' && Object.keys(interviewData.cvAnalysis).length > 0 &&(
        <div className="cv-analysis-section">
          <h3>CV Analysis:</h3>
          <pre>{JSON.stringify(interviewData.cvAnalysis, null, 2)}</pre>
        </div>
      )}


      <div className="results-list">
        {transcriptItems.map((item, index) => (
          <div key={index} className="result-item">
            <div className="result-question">
              Q{index + 1}: {item.questionText} {/* Mapped from questionText */}
            </div>
            <div className="result-answer">
              {item.answerText || "No answer provided"} {/* Mapped from answerText */}
            </div>
            <div className="result-meta">
              <span>
                <span className="meta-label">Duration:</span> 
                {formatDuration(item.durationSeconds || 0)} {/* Mapped from durationSeconds */}
              </span>
              <span>
                <span className="meta-label">Word count:</span> 
                {item.answerText ? item.answerText.split(/\s+/).filter(Boolean).length : 0}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="results-summary">
        <h2>Interview Summary</h2>
        <div className="summary-stats">
          <div className="summary-stat">
            <div className="stat-value">{transcriptItems.length}</div>
            <div className="stat-label">Questions Answered</div>
          </div>
          
          <div className="summary-stat">
            <div className="stat-value">
              {formatDuration(transcriptItems.reduce((total, item) => total + (item.durationSeconds || 0), 0))}
            </div>
            <div className="stat-label">Total Duration</div>
          </div>
          
          <div className="summary-stat">
            <div className="stat-value">
              {transcriptItems.reduce((total, item) => total + (item.answerText ? item.answerText.split(/\s+/).filter(Boolean).length : 0), 0)}
            </div>
            <div className="stat-label">Total Words</div>
          </div>
        </div>
      </div>
      
      <div className="footer">
        <p>© {new Date().getFullYear()} Interview Assistant - Interview ID: {interviewData._id}</p>
      </div>
    </div>
  );
};

export default Results;