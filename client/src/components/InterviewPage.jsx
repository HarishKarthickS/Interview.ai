import React, { useState, useEffect } from 'react';
import Interview from './Interview';
import './Interview.css';

const InterviewPage = () => {
  const [interviewData, setInterviewData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Sample HR questions
  const hrQuestions = [
    "Tell me about yourself and your background.",
    "What are your greatest strengths and weaknesses?",
    "Why are you interested in this position?",
    "Describe a challenging situation you faced at work and how you handled it.",
    "Where do you see yourself in five years?"
  ];
  
  // Sample technical questions
  const techQuestions = [
    "Explain your understanding of RESTful APIs.",
    "What is your experience with frontend frameworks like React or Angular?",
    "How do you approach debugging a complex issue in your code?",
    "Describe your experience with database design and optimization.",
    "How do you stay updated with the latest technologies in your field?"
  ];
  
  // Handle interview mode selection
  const [mode, setMode] = useState('');
  const [questions, setQuestions] = useState([]);
  
  // Set interview questions based on mode
  useEffect(() => {
    if (mode === 'HR') {
      setQuestions(hrQuestions);
    } else if (mode === 'Tech') {
      setQuestions(techQuestions);
    }
  }, [mode]);

  // Handle interview completion
  const handleInterviewComplete = (data) => {
    setIsLoading(true);
    
    // Simulate API call to save interview data
    setTimeout(() => {
      setInterviewData(data);
      setIsCompleted(true);
      setIsLoading(false);
    }, 1500);
  };
  
  // Reset interview
  const handleReset = () => {
    setInterviewData(null);
    setIsCompleted(false);
    setMode('');
    setQuestions([]);
  };

  // Show interview selection if not started
  if (!mode) {
    return (
      <div className="interview-selection">
        <h1>Select Interview Type</h1>
        <div className="mode-selection">
          <button 
            className="mode-button hr" 
            onClick={() => setMode('HR')}
          >
            HR Interview
          </button>
          <button 
            className="mode-button tech" 
            onClick={() => setMode('Tech')}
          >
            Technical Interview
          </button>
        </div>
      </div>
    );
  }

  // Show results if interview completed
  if (isCompleted && interviewData) {
    return (
      <div className="interview-results">
        <h1>Interview Completed!</h1>
        
        <div className="results-summary">
          <p>Mode: <strong>{interviewData.mode}</strong></p>
          <p>Duration: <strong>{Math.floor(interviewData.duration / 60)}m {interviewData.duration % 60}s</strong></p>
          <p>Questions answered: <strong>{interviewData.transcripts.length}</strong></p>
        </div>
        
        <div className="transcript-summary">
          <h2>Your Responses</h2>
          {interviewData.transcripts.map((item, index) => (
            <div key={index} className="response-item">
              <div className="response-question">
                <strong>Q{index + 1}:</strong> {item.questionText}
              </div>
              <div className="response-answer">
                {item.fullText || <i>No response recorded</i>}
              </div>
            </div>
          ))}
        </div>
        
        <button className="reset-button" onClick={handleReset}>
          Start New Interview
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Processing your interview...</p>
      </div>
    );
  }

  // Show the interview component
  return (
    <div className="interview-page">
      <Interview 
        questions={questions} 
        onComplete={handleInterviewComplete}
        mode={mode}
      />
    </div>
  );
};

export default InterviewPage; 