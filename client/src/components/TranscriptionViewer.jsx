import React, { useEffect, useState, useRef } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import TranscriptManager from '../utils/transcriptManager';
import FillerWordsDisplay from './FillerWordsDisplay';
import './TranscriptionViewer.css';

const TranscriptionViewer = ({ 
  currentQuestion, 
  onTranscriptUpdate,
  autoStart = false,
  language = 'en-US',
  showFillerWordsAnalysis = true
}) => {
  const [transcriptManager] = useState(() => new TranscriptManager());
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const segmentsRef = useRef([]);
  
  // Initialize speech recognition hook with options
  const {
    transcript,
    interimTranscript,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
    getTranscriptData,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({
    language,
    continuous: true,
    interimResults: true,
    onError: (error) => console.error('Speech recognition error:', error)
  });

  // Update transcript manager when question changes
  useEffect(() => {
    if (currentQuestion && currentQuestion.id !== undefined) {
      // Stop current recognition if active
      if (isListening) {
        stopListening();
      }
      
      // Reset transcript for new question
      resetTranscript();
      setCurrentTranscript('');
      segmentsRef.current = [];
      
      // Set current question in transcript manager
      transcriptManager.setCurrentQuestion(
        currentQuestion.id,
        currentQuestion.text
      );
      
      // Restart listening if autoStart is enabled
      if (autoStart) {
        startListening();
      }
    }
  }, [currentQuestion, resetTranscript, startListening, stopListening, transcriptManager, autoStart, isListening]);

  // Process transcript updates
  useEffect(() => {
    if (transcript) {
      setCurrentTranscript(transcript);
      
      // Get transcript data with timestamps
      const data = getTranscriptData();
      
      // Add only new segments to transcript manager
      const newSegments = data.segments.slice(segmentsRef.current.length);
      if (newSegments.length > 0) {
        transcriptManager.addTranscriptSegments(newSegments);
        segmentsRef.current = data.segments;
        
        // Notify parent component of updates
        if (onTranscriptUpdate) {
          const questionTranscript = transcriptManager.getQuestionTranscript(currentQuestion.id);
          onTranscriptUpdate(questionTranscript);
        }
      }
    }
  }, [transcript, getTranscriptData, transcriptManager, currentQuestion, onTranscriptUpdate]);

  // Handle case when browser doesn't support speech recognition
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="transcription-error">
        Your browser doesn't support speech recognition.
        Please try Chrome, Edge, or Safari.
      </div>
    );
  }

  return (
    <div className="transcription-viewer">
      <div className="transcription-controls">
        {!isListening ? (
          <button 
            onClick={startListening}
            className="control-button start"
            disabled={!currentQuestion}
          >
            Start Recording
          </button>
        ) : (
          <button 
            onClick={stopListening}
            className="control-button stop"
          >
            Stop Recording
          </button>
        )}
        
        <button 
          onClick={() => {
            resetTranscript();
            setCurrentTranscript('');
            segmentsRef.current = [];
            
            if (currentQuestion) {
              transcriptManager.setCurrentQuestion(
                currentQuestion.id,
                currentQuestion.text
              );
            }
            
            if (onTranscriptUpdate) {
              onTranscriptUpdate({
                questionId: currentQuestion?.id,
                questionText: currentQuestion?.text,
                fullText: '',
                segments: []
              });
            }
          }}
          className="control-button reset"
        >
          Reset
        </button>
        
        {showFillerWordsAnalysis && currentTranscript && (
          <button
            onClick={() => setShowFullAnalysis(!showFullAnalysis)}
            className="control-button analyze"
          >
            {showFullAnalysis ? 'Hide Analysis' : 'Show Filler Words'}
          </button>
        )}
      </div>
      
      <div className="transcription-status">
        {isListening ? (
          <span className="status recording">Recording...</span>
        ) : (
          <span className="status idle">Waiting to record</span>
        )}
        {error && <span className="error">{error}</span>}
      </div>
      
      <div className="transcription-text">
        {showFillerWordsAnalysis && showFullAnalysis ? (
          <FillerWordsDisplay transcript={currentTranscript} />
        ) : (
          <>
            <div className="transcript-final">
              {currentTranscript}
            </div>
            <div className="transcript-interim">
              {interimTranscript}
            </div>
          </>
        )}
      </div>

      {/* Show compact filler words summary when not showing full analysis */}
      {showFillerWordsAnalysis && currentTranscript && !showFullAnalysis && (
        <div className="filler-words-mini-summary">
          <FillerWordsDisplay transcript={currentTranscript} showSummary={true} />
        </div>
      )}

      <div className="language-selector">
        <select 
          onChange={(e) => {
            // We would need to stop and restart recognition to change language
            if (isListening) {
              stopListening();
              // This will trigger a re-render with new language
              // A more complete implementation would update language state
            }
          }}
          value={language}
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
  );
};

export default TranscriptionViewer; 