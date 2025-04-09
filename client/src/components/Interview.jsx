import React, { useState, useEffect, useCallback } from 'react';
import TranscriptionViewer from './TranscriptionViewer';
import TranscriptManager from '../utils/transcriptManager';

const Interview = ({ 
  questions = [], 
  onComplete,
  mode = 'HR' // or 'Tech'
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcriptManager] = useState(() => new TranscriptManager());
  const [transcripts, setTranscripts] = useState({});
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [language, setLanguage] = useState('en-US');

  // Format current question for TranscriptionViewer
  const currentQuestion = questions[currentQuestionIndex] ? {
    id: currentQuestionIndex,
    text: questions[currentQuestionIndex],
    order: currentQuestionIndex + 1
  } : null;

  // Start the interview session
  useEffect(() => {
    if (questions.length > 0 && !isActive) {
      transcriptManager.startSession();
      setIsActive(true);
      // Start the timer
      const intervalId = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [questions.length, transcriptManager, isActive]);

  // Handle transcript updates from TranscriptionViewer
  const handleTranscriptUpdate = useCallback((questionTranscript) => {
    if (questionTranscript && questionTranscript.questionId !== undefined) {
      setTranscripts(prev => ({
        ...prev,
        [questionTranscript.questionId]: questionTranscript
      }));
    }
  }, []);

  // Navigate to the next question
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // At the end of all questions
      handleFinishInterview();
    }
  }, [currentQuestionIndex, questions.length]);

  // Navigate to the previous question
  const handlePrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Finish the interview and send data to parent
  const handleFinishInterview = useCallback(() => {
    transcriptManager.endSession();
    const allTranscripts = transcriptManager.getAllTranscripts();
    const formattedTranscripts = transcriptManager.getFormattedTranscriptForSubmission();
    
    if (onComplete) {
      onComplete({
        transcripts: allTranscripts,
        formattedData: formattedTranscripts,
        duration: timer,
        mode
      });
    }
  }, [transcriptManager, onComplete, timer, mode]);

  // Format time display for timer
  const formatTime = useCallback((time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // If there are no questions, show a message
  if (questions.length === 0) {
    return <div className="interview-empty">No questions available for this interview.</div>;
  }

  return (
    <div className="interview-container">
      <div className="interview-header">
        <div className="interview-mode">
          Mode: {mode}
        </div>
        <div className="interview-timer">
          {formatTime(timer)}
        </div>
        <div className="interview-language">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="hi-IN">Hindi</option>
            <option value="ja-JP">Japanese</option>
          </select>
        </div>
      </div>

      <div className="interview-question">
        <h3>Question {currentQuestionIndex + 1} of {questions.length}</h3>
        <div className="question-text">
          {currentQuestion?.text}
        </div>
      </div>

      <div className="interview-transcription">
        <TranscriptionViewer
          currentQuestion={currentQuestion}
          onTranscriptUpdate={handleTranscriptUpdate}
          autoStart={true}
          language={language}
        />
      </div>

      <div className="interview-navigation">
        <button
          className="nav-button prev"
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>
        
        {currentQuestionIndex < questions.length - 1 ? (
          <button
            className="nav-button next"
            onClick={handleNextQuestion}
          >
            Next
          </button>
        ) : (
          <button
            className="nav-button finish"
            onClick={handleFinishInterview}
          >
            Finish Interview
          </button>
        )}
      </div>

      <div className="interview-progress">
        <div 
          className="progress-bar"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Interview; 