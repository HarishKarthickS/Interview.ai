import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInterview, updateInterview } from '../utils/api'; // Import API functions
import './SpeechProcessor.css';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faMicrophone, faStop, faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';

const SpeechProcessor = ({ questions, onTranscriptUpdate }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  // Component state
  const [currentInterviewId, setCurrentInterviewId] = useState(null); // Added state for interview ID
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevels, setAudioLevels] = useState(Array(30).fill(2));
  // Ensure answers state stores objects: { question: String, answer: String, duration: Number }
  const [answers, setAnswers] = useState([]); 
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [timer, setTimer] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  // Removed _hasMicPermission state as its value was not directly used to influence rendering or logic.
  // Toast notifications are used for mic permission feedback.
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpTips, setShowHelpTips] = useState(false);
  const [activePanel, setActivePanel] = useState('question');
  const [wordCount, setWordCount] = useState(0);
  const [animateQuestion, setAnimateQuestion] = useState(false);
  
  // Refs
  const recognition = useRef(null);
  const timerInterval = useRef(null);
  const audioContext = useRef(null);
  const analyzer = useRef(null);
  const microphone = useRef(null);
  const audioLevelInterval = useRef(null);
  const toastTimeout = useRef(null);
  const transcriptRef = useRef(null);
  
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Toast notification needs to be defined first as it's used by other functions
  const showToast = useCallback((message, type = 'info') => {
    // Clear any existing toast timeout
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    
    // If there's a current toast, first hide it with animation
    if (toast.show) {
      setToast(prev => ({ ...prev, show: false, animating: true }));
      
      // After animation completes, show the new toast
      setTimeout(() => {
        setToast({ show: true, message, type, animating: false });
        
        // Hide toast after 5 seconds
        toastTimeout.current = setTimeout(() => {
          setToast(prev => ({ ...prev, show: false }));
        }, 5000);
      }, 300);
    } else {
      // Show toast immediately if none is currently showing
      setToast({ show: true, message, type, animating: false });
      
      // Hide toast after 5 seconds
      toastTimeout.current = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 5000);
    }
  }, [toast]);

  // Calculate word count when transcript changes
  useEffect(() => {
    if (transcript) {
      setWordCount(transcript.split(/\s+/).filter(Boolean).length);
    } else {
      setWordCount(0);
    }
  }, [transcript]);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      showToast('Speech recognition not supported in this browser.', 'error');
      return false;
    }
    
    recognition.current = new SpeechRecognition();
    recognition.current.continuous = true;
    recognition.current.interimResults = true;
    recognition.current.lang = 'en-US';
    
    recognition.current.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + ' ';
        } else {
          interimText += event.results[i][0].transcript;
        }
      }
      
      setTranscript(finalText.trim());
      setInterimTranscript(interimText.trim());
      
      // Scroll transcript area to bottom when new content is added
      if (transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
      }
      
      // Update parent component if callback exists
      if (onTranscriptUpdate) {
        onTranscriptUpdate(finalText.trim());
      }
    };
    
    recognition.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        // setHasMicPermission(false); // Removed as _hasMicPermission state is removed
        showToast('Microphone permission denied. Please allow access to continue.', 'error');
      }
    };
    
    return true;
  }, [showToast, onTranscriptUpdate]);
  
  // Initialize audio analyzer for visualization
  const initAudioAnalyzer = useCallback(async () => {
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // setHasMicPermission(true); // Removed as _hasMicPermission state is removed
      
      if (microphone.current) {
        microphone.current.disconnect();
      }
      
      microphone.current = audioContext.current.createMediaStreamSource(stream);
      analyzer.current = audioContext.current.createAnalyser();
      analyzer.current.fftSize = 256;
      
      microphone.current.connect(analyzer.current);
      
      return { stream, success: true };
    } catch (error) {
      console.error('Error accessing microphone:', error);
      // setHasMicPermission(false); // Removed as _hasMicPermission state is removed
      showToast('Unable to access your microphone. Please check permissions.', 'error');
      return { success: false };
    }
  }, [showToast]);
  
  // Start recording timer
  const startTimer = useCallback(() => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    
    setTimer(0);
    const startTime = Date.now();
    
    timerInterval.current = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      setTimer(elapsedTime);
    }, 1000);
  }, []);
  
  // Stop recording timer
  const stopTimer = useCallback(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  }, []);
  
  // Record audio levels for visualization
  const startAudioLevelCapture = useCallback(() => {
    if (!analyzer.current) return;
    
    const dataArray = new Uint8Array(analyzer.current.frequencyBinCount);
    
    audioLevelInterval.current = setInterval(() => {
      analyzer.current.getByteFrequencyData(dataArray);
      
      // Calculate average levels from frequency data
      const values = Array(30).fill(0);
      const step = Math.floor(dataArray.length / 30);
      
      for (let i = 0; i < 30; i++) {
        const start = i * step;
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[start + j] || 0;
        }
        // Scale the value to make it visually appealing
        const scaledValue = Math.max(2, Math.min(50, (sum / step) * 0.5));
        values[i] = scaledValue;
      }
      
      setAudioLevels(values);
    }, 100);
  }, []);
  
  // Stop audio level capture
  const stopAudioLevelCapture = useCallback(() => {
    if (audioLevelInterval.current) {
      clearInterval(audioLevelInterval.current);
      audioLevelInterval.current = null;
      setAudioLevels(Array(30).fill(2)); // Reset to minimum height
    }
  }, []);
  
  // _setupAudioCapture function removed as it was unused.
  // Its functionality is covered by initAudioAnalyzer and startAudioLevelCapture.
  
  // Provide feedback based on recording duration
  const provideFeedback = useCallback((durationSeconds) => {
    let message, type;
    
    if (durationSeconds < 10) {
      message = "Your answer was very brief. Consider providing more details in your responses.";
      type = "warning";
    } else if (durationSeconds < 20) {
      message = "Your answer was concise. You might want to elaborate a bit more.";
      type = "info";
    } else if (durationSeconds < 45) {
      message = "Good answer length! You've provided a reasonable amount of detail.";
      type = "success";
    } else if (durationSeconds < 90) {
      message = "Detailed answer! Your thorough responses will make a good impression.";
      type = "success";
    } else {
      message = "Comprehensive answer! Be mindful that in some interviews, concise responses may be preferred.";
      type = "info";
    }
    
    setFeedback({ message, type });
    return { message, type };
  }, []);
  
  // Stop recording function
  const stopRecording = useCallback(() => {
    if (recognition.current) {
      try {
        recognition.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    
    // Stop timers and visualizations
    stopTimer();
    stopAudioLevelCapture();
  }, [stopTimer, stopAudioLevelCapture]);
  
  // Start interview recording
  const startInterview = useCallback(async () => {
    try {
      setIsLoading(true);

      // Create interview if not already created
      if (!currentInterviewId && questions && questions.length > 0) {
        try {
          showToast('Creating interview session...', 'info');
          // Pass the array of question strings directly
          const newInterview = await createInterview(questions); 
          if (newInterview && newInterview._id) {
            setCurrentInterviewId(newInterview._id);
            // Initialize answers array for the current session
            setAnswers(questions.map(q => ({ question: q, answer: '', duration: 0 })));
            showToast('Interview session created!', 'success');
          } else {
            throw new Error('Failed to create interview session.');
          }
        } catch (apiError) {
          console.error('Error creating interview:', apiError);
          showToast(apiError.message || 'Could not create interview session. Please try again.', 'error');
          setIsLoading(false);
          return; // Stop if interview creation fails
        }
      }
      
      // Check microphone permissions
      // The act of getting user media here will trigger the browser permission prompt
      // if not already granted. If it fails, it will throw an error caught below.
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // setHasMicPermission(true); // Removed
      
      // Setup audio visualization
      const { success } = await initAudioAnalyzer();
      if (!success) {
        setIsLoading(false);
        return;
      }
      
      // Start recording
      if (!recognition.current && !initSpeechRecognition()) {
        setIsLoading(false);
        return;
      }
      
      recognition.current.start();
      setIsRecording(true);
      setTranscript('');
      setInterimTranscript('');
      setFeedback(null);
      
      // Start timer and animation
      setRecordingStartTime(Date.now());
      startTimer();
      startAudioLevelCapture();
      setActivePanel('transcript');
      
      // Show toast notification
      showToast('Recording started. Speak clearly into your microphone.', 'info');
    } catch (error) {
      console.error('Error starting interview:', error);
      showToast('Could not access microphone. Please check your permissions.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [initAudioAnalyzer, initSpeechRecognition, startTimer, startAudioLevelCapture, showToast]);
  
  // Stop interview recording
  const stopInterview = useCallback(async () => { // Made async
    if (!isRecording) return;
    
    try {
      setIsLoading(true);
      
      // Stop recording
      setIsRecording(false);
      stopRecording(); // This handles speech recognition stop, timer, audio levels
      
      const recordingDurationSeconds = Math.round((Date.now() - recordingStartTime) / 1000);
      
      // Provide feedback based on duration
      const currentFeedback = provideFeedback(recordingDurationSeconds);
      setFeedback(currentFeedback);
      
      // Prepare the answer object
      const newAnswerData = {
        question: questions[currentQuestionIndex],
        answer: transcript, // transcript state already holds the final text
        duration: recordingDurationSeconds,
      };

      // Update local answers state
      const updatedAnswers = answers.map((ans, index) => 
        index === currentQuestionIndex ? newAnswerData : ans
      );
      setAnswers(updatedAnswers);
      
      // Persist to backend
      if (currentInterviewId) {
        try {
          showToast('Saving answer...', 'info');
          const transcriptForApi = updatedAnswers.map(ans => ({
            questionText: ans.question,
            answerText: ans.answer,
            durationSeconds: ans.duration,
          }));
          await updateInterview(currentInterviewId, { transcript: transcriptForApi });
          showToast('Answer saved successfully to server!', 'success');
        } catch (apiError) {
          console.error('Error updating interview:', apiError);
          showToast(apiError.message || 'Could not save answer to server.', 'error');
          // Potentially handle auth error specifically:
          if (apiError.message.toLowerCase().includes('auth') || apiError.message.toLowerCase().includes('token')) {
             showToast('Authentication error. Please log in again.', 'error');
             // Consider redirecting to login: navigate('/login');
          }
        }
      } else {
        showToast('Cannot save answer: No active interview session.', 'warning');
      }
      
      // Reset audio visualization (original logic)
      if (analyzer.current) {
        analyzer.current.disconnect();
        analyzer.current = null;
      }
      
      setActivePanel('question');
      showToast('Recording saved successfully', 'success');
      
    } catch (error) {
      console.error('Error stopping interview:', error);
      showToast('An error occurred while saving your recording', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isRecording, recordingStartTime, stopRecording, provideFeedback, answers, currentQuestionIndex, transcript, showToast]);
  
  // Save current answer function
  const saveCurrentAnswer = useCallback(async () => { // Made async
    if (!transcript.trim()) {
      showToast('Cannot save empty answer.', 'warning');
      return;
    }
    if (!currentInterviewId) {
      showToast('Cannot save: No active interview session. Please start recording first.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const recordingDurationSeconds = timer; // Use the current timer value if not actively recording

      const currentAnswerData = {
        question: questions[currentQuestionIndex],
        answer: transcript,
        duration: recordingDurationSeconds,
      };

      const updatedAnswers = answers.map((ans, index) =>
        index === currentQuestionIndex ? currentAnswerData : ans
      );
      setAnswers(updatedAnswers);

      showToast('Saving answer to server...', 'info');
      const transcriptForApi = updatedAnswers.map(ans => ({
        questionText: ans.question,
        answerText: ans.answer,
        durationSeconds: ans.duration,
      }));
      await updateInterview(currentInterviewId, { transcript: transcriptForApi });
      showToast('Answer saved successfully!', 'success');
    } catch (apiError) {
      console.error('Error saving answer:', apiError);
      showToast(apiError.message || 'Could not save answer.', 'error');
       if (apiError.message.toLowerCase().includes('auth') || apiError.message.toLowerCase().includes('token')) {
         showToast('Authentication error. Please log in again.', 'error');
         // navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [transcript, answers, currentQuestionIndex, setAnswers, showToast, currentInterviewId, questions, timer, setIsLoading]);
  
  // Navigate to previous question
  const goToPreviousQuestion = useCallback(async () => { // Made async
    if (currentQuestionIndex > 0) {
      // Save current answer if it exists and there's an active interview
      if (transcript.trim() && currentInterviewId) {
        try {
          setIsLoading(true); // Show loading indicator during save
          await saveCurrentAnswer();
        } catch (error) {
          // saveCurrentAnswer already shows toasts for errors
          console.error("Error saving answer before going to previous question:", error);
          // Optionally, ask user if they want to proceed despite save error
        } finally {
          setIsLoading(false);
        }
      }

      // Apply animation class for transition
      setAnimateQuestion(true);
      
      // Small delay for animation effect
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        setFeedback(null); // Clear feedback for the new question
        
        // Load the answer for the new (previous) question
        const prevAnswerData = answers[currentQuestionIndex - 1];
        if (prevAnswerData && prevAnswerData.answer) {
          setTranscript(prevAnswerData.answer);
        } else {
          setTranscript('');
        }
        setInterimTranscript('');


        // Reset animation flag after transition
        setTimeout(() => {
          setAnimateQuestion(false);
        }, 300);
      }, 300);
    }
  }, [currentQuestionIndex, transcript, currentInterviewId, saveCurrentAnswer, answers, setIsLoading]);
  
  // Navigate to next question
  const goToNextQuestion = useCallback(async () => { // Made async
    if (currentQuestionIndex < questions.length - 1) {
      // Save current answer if it exists and there's an active interview
      if (transcript.trim() && currentInterviewId) {
         try {
          setIsLoading(true); // Show loading indicator during save
          await saveCurrentAnswer();
        } catch (error) {
          console.error("Error saving answer before going to next question:", error);
        } finally {
          setIsLoading(false);
        }
      }

      // Apply animation class for transition
      setAnimateQuestion(true);
      
      // Small delay for animation effect
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        // Clear transcript for the new question if no existing answer is loaded
        // Or load existing answer for the next question
        const nextAnswerData = answers[currentQuestionIndex + 1];
        if (nextAnswerData && nextAnswerData.answer) {
          setTranscript(nextAnswerData.answer);
        } else {
          setTranscript('');
        }
        setInterimTranscript('');
        setFeedback(null);
        
        // Reset animation flag after transition
        setTimeout(() => {
          setAnimateQuestion(false);
        }, 300);
      }, 300);
    }
  }, [currentQuestionIndex, questions.length, transcript, currentInterviewId, saveCurrentAnswer, answers, setIsLoading]);
  
  // Complete the interview
  const finishInterview = useCallback(async () => { // Made async
    if (isRecording) {
      await stopInterview(); // Ensure recording is stopped and answer saved
    } else if (transcript.trim() && answers[currentQuestionIndex]?.answer !== transcript) {
      // If not recording, but there's unsaved transcript for the current question, save it.
      await saveCurrentAnswer();
    }
    
    setIsLoading(true);
    showToast('Interview completed! Finalizing results...', 'success');
    
    // Ensure all answers are up-to-date for the results page
    // The `answers` state should be current due to previous saves.
    // No specific final API call needed here if each answer is updated individually,
    // unless there's a specific "finalize" endpoint. Assuming not for now.

    // Navigate to results page with potentially updated answers.
    // The `answers` state (which is {question, answer, duration}) is passed.
    // Results.jsx will need to handle this structure.
    setTimeout(() => {
      navigate('/results', { state: { answers, interviewId: currentInterviewId } }); // Pass interviewId too
      setIsLoading(false);
    }, 1500);
  }, [isRecording, stopInterview, saveCurrentAnswer, answers, navigate, showToast, currentQuestionIndex, transcript, currentInterviewId, setIsLoading]);
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check for microphone permission on mount
  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        // Attempt to get mic stream to check permission, then stop tracks immediately
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // setHasMicPermission(true); // Removed
        stream.getTracks().forEach(track => track.stop()); // Release the mic
      } catch (error) {
        // setHasMicPermission(false); // Removed
        console.error('Initial microphone permission check failed:', error);
        // A toast might be redundant here if startInterview will also show one on failure.
        // However, a gentle initial warning could be:
        // showToast('Microphone access might be required. Please ensure it is enabled.', 'warning');
      }
    };
    
    checkMicPermission();
    
    // Show welcome toast after a short delay
    const welcomeTimer = setTimeout(() => {
      showToast('Welcome to Interview Assistant! Press the Start Recording button or spacebar to begin.', 'info');
    }, 1000);

    return () => clearTimeout(welcomeTimer); // Cleanup timer
  }, [showToast]); // showToast is stable due to useCallback
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent handling if in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          isRecording ? stopInterview() : startInterview();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPreviousQuestion();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNextQuestion();
          break;
        case 'Enter':
          if (e.ctrlKey && isLastQuestion) {
            e.preventDefault();
            finishInterview();
          }
          break;
        case 'KeyS':
          if (e.ctrlKey) {
            e.preventDefault();
            saveCurrentAnswer();
          }
          break;
        case 'KeyH':
          if (e.ctrlKey) {
            e.preventDefault();
            setShowHelpTips(!showHelpTips);
          }
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentQuestionIndex, isRecording, isLastQuestion, showHelpTips, startInterview, stopInterview, goToPreviousQuestion, goToNextQuestion, finishInterview, saveCurrentAnswer]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop recognition
      if (recognition.current) {
        try {
          recognition.current.stop();
        } catch {
          // Ignore errors when stopping
        }
      }
      
      // Clear intervals
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (audioLevelInterval.current) clearInterval(audioLevelInterval.current);
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      
      // Disconnect audio
      if (microphone.current) {
        try {
          microphone.current.disconnect();
        } catch {
          // Ignore disconnect errors
        }
      }
      
      // Close audio context
      if (audioContext.current && audioContext.current.state !== 'closed') {
        try {
          audioContext.current.close();
        } catch {
          // Ignore close errors
        }
      }
    };
  }, []);
  
  return (
    <div className={`speech-processor ${isRecording ? 'recording' : ''} ${theme === 'dark' ? 'dark-mode' : ''} ${isLoading ? 'loading' : ''}`}>
      <div className="app-header">
        <h1 className="app-title">Interview Assistant</h1>
        <div className="header-actions">
          <button 
            className="icon-btn help-btn" 
            onClick={() => setShowHelpTips(!showHelpTips)}
            aria-label="Help and tips"
            title="Help and tips"
          >
            <span className="btn-icon">❓</span>
          </button>
          <button 
            className="icon-btn" 
            onClick={() => showToast('Keyboard shortcuts: Space to start/stop recording, Arrow keys to navigate questions, Ctrl+Enter to finish', 'info')}
            aria-label="Show keyboard shortcuts"
            title="Show keyboard shortcuts"
          >
            <span className="btn-icon">⌨️</span>
          </button>
          <button
            className="icon-btn save-btn"
            onClick={saveCurrentAnswer}
            disabled={isRecording || !transcript.trim()}
            aria-label="Save answer"
            title="Save answer (Ctrl+S)"
          >
            <span className="btn-icon">💾</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
      
      <div className="interview-progress">
        <div className="progress-track">
          <div 
            className="progress-track-line" 
            style={{ width: `${(currentQuestionIndex / (questions.length - 1)) * 100}%` }}
          ></div>
          
          {questions.map((_, index) => (
            <div 
              key={index}
              className={`progress-step ${
                index === currentQuestionIndex ? 'active' : 
                index < currentQuestionIndex ? 'completed' : ''
              }`}
              onClick={async () => { // Made async
                if (isRecording) {
                  // Need to await stopInterview as it also saves
                  await stopInterview(); 
                } else if (transcript.trim() && currentInterviewId && index !== currentQuestionIndex) {
                  // Save only if there's text, an active interview, and changing question
                  try {
                    setIsLoading(true);
                    await saveCurrentAnswer();
                  } catch (error) {
                    console.error("Error saving answer on progress step click:", error);
                  } finally {
                    setIsLoading(false);
                  }
                }
                
                // Add animation class
                document.body.classList.add('question-transition');
                setTimeout(() => {
                  document.body.classList.remove('question-transition');
                }, 500);
                
                setCurrentQuestionIndex(index);
                // Load existing answer from the structured 'answers' state
                const currentAnswerData = answers[index];
                if (currentAnswerData && currentAnswerData.answer) {
                  setTranscript(currentAnswerData.answer);
                } else {
                  setTranscript('');
                }
                setInterimTranscript('');
                setFeedback(null);
              }}
              title={`Question ${index + 1}`}
              role="button"
              tabIndex={0}
              aria-label={`Go to question ${index + 1}`}
              aria-current={index === currentQuestionIndex ? 'step' : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (isRecording) {
                    await stopInterview(); // Await if recording
                  } else if (transcript.trim() && currentInterviewId && index !== currentQuestionIndex) {
                     try {
                       setIsLoading(true);
                       await saveCurrentAnswer();
                     } catch (error) {
                       console.error("Error saving answer on progress step keydown:", error);
                     } finally {
                       setIsLoading(false);
                     }
                  }
                  
                  // Add animation class
                  document.body.classList.add('question-transition');
                  setTimeout(() => {
                    document.body.classList.remove('question-transition');
                  }, 500);
                  
                  setCurrentQuestionIndex(index);
                  // Load existing answer from the structured 'answers' state
                  const currentAnswerData = answers[index];
                  if (currentAnswerData && currentAnswerData.answer) {
                    setTranscript(currentAnswerData.answer);
                  } else {
                    setTranscript('');
                  }
                  setInterimTranscript('');
                  setFeedback(null);
                }
              }}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>
      
      <div className="main-content">
        <div 
          className={`question-panel ${activePanel === 'question' ? 'active-panel' : ''}`} 
          onClick={() => setActivePanel('question')}
          tabIndex={0}
          role="region"
          aria-label="Question panel"
        >
          <div className="panel-header">
            <h2 className="panel-title">Question {currentQuestionIndex + 1}</h2>
            <div className="question-counter">
              {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
          
          <div className={`question ${animateQuestion ? 'question-transition' : 'animate-in'}`}>
            {questions[currentQuestionIndex]}
          </div>
          
          <div className="controls">
            <button 
              className="control-btn prev-btn"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0 || isRecording || isLoading}
              aria-label="Previous question"
            >
              <span className="btn-text">
                <FontAwesomeIcon icon={faArrowLeft} /> Prev
              </span>
            </button>
            
            {!isRecording ? (
              <button 
                className="control-btn start-btn"
                onClick={startInterview}
                disabled={isLoading}
                aria-label="Start recording"
              >
                <span className="btn-text">
                  {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faMicrophone} />} 
                  Record
                </span>
              </button>
            ) : (
              <button 
                className="control-btn stop-btn"
                onClick={stopInterview}
                disabled={isLoading}
                aria-label="Stop recording"
              >
                <span className="btn-text">
                  {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faStop} />} 
                  Stop
                </span>
              </button>
            )}
            
            <button 
              className="control-btn next-btn"
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1 || isRecording || isLoading}
              aria-label="Next question"
            >
              <span className="btn-text">
                Next <FontAwesomeIcon icon={faArrowRight} />
              </span>
            </button>
          </div>
        </div>
        
        <div 
          className={`transcript-panel ${activePanel === 'transcript' ? 'active-panel' : ''}`}
          onClick={() => setActivePanel('transcript')}
          tabIndex={0}
          role="region"
          aria-label="Transcript panel"
        >
          <div className="panel-header">
            <h2 className="panel-title">Your Answer</h2>
            <div className="status-indicator">
              <div className={`mic-status ${isRecording ? 'active' : ''}`}>
                {isRecording && <span className="pulse-dot"></span>}
                <span className="mic-icon">🎤</span>
                {isRecording ? 'Recording...' : 'Ready'}
              </div>
            </div>
          </div>
          
          {isRecording && (
            <>
              <div className="speech-metrics">
                <div className="metric">
                  <span className="metric-label">Time</span>
                  <span className="metric-value time-elapsed">{formatTime(timer)}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Words</span>
                  <span className="metric-value">{wordCount}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Status</span>
                  <span className="metric-value">
                    <span className="pulse-dot"></span> Live
                  </span>
                </div>
              </div>
              
              <div className="waveform-container">
                {audioLevels.map((level, i) => (
                  <div 
                    key={i} 
                    className="waveform-bar" 
                    style={{ height: `${level}px` }}
                  ></div>
                ))}
              </div>
            </>
          )}
          
          <div 
            className="transcript" 
            ref={transcriptRef}
            tabIndex={0}
            role="textbox"
            aria-multiline="true"
            aria-label="Your answer transcript"
          >
            {transcript || interimTranscript ? (
              <>
                {transcript && <p className="transcript-text">{transcript}</p>}
                {interimTranscript && <p className="interim">{interimTranscript}</p>}
              </>
            ) : (
              <div className="empty-transcript">
                <div className="empty-transcript-icon">🎙️</div>
                <p>Your answer will appear here.</p>
                <p>Press the Start Recording button or spacebar to begin.</p>
              </div>
            )}
            
            {feedback && (
              <div className={`feedback-panel ${feedback.type}`}>
                {feedback.message}
              </div>
            )}
          </div>
          
          {!isRecording && transcript && (
            <div className="transcript-footer">
              <div className="word-count">
                <span className="count-label">Word Count:</span> 
                <span className="count-value">{wordCount}</span>
              </div>
              
              <button 
                className="save-transcript-btn"
                onClick={() => {
                  // This button should also call saveCurrentAnswer to persist to backend
                  saveCurrentAnswer();
                }}
                disabled={!transcript.trim() || isRecording || isLoading}
                aria-label="Save transcript"
              >
                <FontAwesomeIcon icon={faSave} /> Save
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showHelpTips && (
        <div className="tips-panel" role="dialog" aria-label="Help and tips">
          <button 
            className="close-tips-btn" 
            onClick={() => setShowHelpTips(false)}
            aria-label="Close help tips"
          >
            ×
          </button>
          
          <div className="tips-section">
            <h3>Interview Tips</h3>
            <div className="tips-card-container">
              <div className="tips-card">
                <h4>Structure Your Answers</h4>
                <ul className="tips-card-list">
                  <li>Start with a brief introduction</li>
                  <li>Provide specific examples</li>
                  <li>End with a conclusion that ties back to the question</li>
                </ul>
              </div>
              
              <div className="tips-card">
                <h4>Speaking Clearly</h4>
                <ul className="tips-card-list">
                  <li>Speak at a moderate pace</li>
                  <li>Articulate your words clearly</li>
                  <li>Avoid filler words (um, uh, like)</li>
                </ul>
              </div>
              
              <div className="tips-card">
                <h4>Body Language</h4>
                <ul className="tips-card-list">
                  <li>Maintain good posture</li>
                  <li>Make eye contact</li>
                  <li>Use appropriate hand gestures</li>
                </ul>
              </div>
              
              <div className="tips-card">
                <h4>Common Mistakes</h4>
                <ul className="tips-card-list">
                  <li>Speaking too fast</li>
                  <li>Giving overly lengthy answers</li>
                  <li>Not providing specific examples</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="tips-section">
            <h3>Keyboard Shortcuts</h3>
            <ul className="shortcut-list">
              <li><span className="key">Space</span> Start/Stop recording</li>
              <li><span className="key">←</span> Previous question</li>
              <li><span className="key">→</span> Next question</li>
              <li><span className="key">Ctrl</span> + <span className="key">S</span> Save answer</li>
              <li><span className="key">Ctrl</span> + <span className="key">H</span> Show/hide help</li>
              <li><span className="key">Ctrl</span> + <span className="key">Enter</span> Finish interview</li>
            </ul>
          </div>
        </div>
      )}
      
      <div className="footer">
        <p className="keyboard-hint">
          Press <strong>Space</strong> to start/stop recording. Use <strong>Arrow keys</strong> to navigate questions.
          <span className="hint-extra"> Press <strong>Ctrl+S</strong> to save your answer.</span>
          {isLastQuestion && <span> Press <strong>Ctrl+Enter</strong> to finish interview.</span>}
        </p>
      </div>
      
      {toast.show && (
        <div className={`toast-notification ${toast.type} ${toast.animating ? 'hide' : ''}`} 
          role="alert"
          aria-live="polite"
        >
          <span>{toast.message}</span>
          <button 
            className="toast-close" 
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
      
      {isLoading && (
        <div className="global-loading">
          <div className="loading-indicator">
            <FontAwesomeIcon icon={faSpinner} spin />
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechProcessor;