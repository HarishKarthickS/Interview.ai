import { useState, useEffect, useCallback, useRef } from 'react';

const useSpeechRecognition = (options = {}) => {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
    onError = () => {},
  } = options;

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const resultStartTimeRef = useRef(null);
  const transcriptTimestampsRef = useRef([]);

  // Check browser support for Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
  const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

  const browserSupportsSpeechRecognition = !!SpeechRecognition;

  // Initialize and handle speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      onError('Speech recognition not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    
    // Configure recognition
    if (SpeechGrammarList) {
      const speechRecognitionList = new SpeechGrammarList();
      recognition.grammars = speechRecognitionList;
    }
    
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;

    // Handle start event
    recognition.onstart = () => {
      setIsListening(true);
      resultStartTimeRef.current = Date.now();
    };

    // Handle error event
    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Handle no speech detected (noise)
        console.log('No speech detected. Continuing...');
        return;
      }
      
      setError(event.error);
      onError(event.error);
      setIsListening(false);
    };

    // Handle end event
    recognition.onend = () => {
      setIsListening(false);
      // Auto restart if listening is still active
      if (isListening && continuous) {
        recognition.start();
      }
    };

    // Handle result event
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
          
          // Add timestamp for this segment
          transcriptTimestampsRef.current.push({
            text: event.results[i][0].transcript,
            startTime: resultStartTimeRef.current,
            endTime: Date.now(),
            confidence: event.results[i][0].confidence
          });
          
          // Reset start time for next segment
          resultStartTimeRef.current = Date.now();
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setTranscript(prev => prev + finalTranscript);
      setInterimTranscript(interimTranscript);
    };

    recognitionRef.current = recognition;
  }, [
    browserSupportsSpeechRecognition,
    continuous,
    interimResults,
    isListening,
    language,
    maxAlternatives,
    onError
  ]);

  // Start listening function
  const startListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      onError('Speech recognition not supported in this browser.');
      return;
    }

    if (!recognitionRef.current) {
      initializeSpeechRecognition();
    }

    try {
      recognitionRef.current.start();
      setTranscript('');
      setInterimTranscript('');
      transcriptTimestampsRef.current = [];
      resultStartTimeRef.current = Date.now();
      setIsListening(true);
      setError(null);
    } catch (err) {
      console.error('Speech recognition error:', err);
      setError('Failed to start speech recognition');
      onError('Failed to start speech recognition');
    }
  }, [browserSupportsSpeechRecognition, initializeSpeechRecognition, onError]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Reset transcript function
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    transcriptTimestampsRef.current = [];
  }, []);

  // Get transcript with timestamps
  const getTranscriptData = useCallback(() => {
    return {
      fullText: transcript,
      segments: transcriptTimestampsRef.current
    };
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
    getTranscriptData,
    browserSupportsSpeechRecognition
  };
};

export default useSpeechRecognition; 