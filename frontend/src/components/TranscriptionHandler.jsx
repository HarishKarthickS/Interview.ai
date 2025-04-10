import { useState, useEffect, useRef } from 'react';

const TranscriptionHandler = ({ 
  onTranscriptUpdate, 
  language = 'en-US', 
  onSilence, 
  onLowVolume, 
  onFillerWord,
  onAudioLevelChange 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognition = useRef(null);
  const silenceTimer = useRef(null);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const microphone = useRef(null);
  const audioLevelTimer = useRef(null);
  const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally'];
  
  // Initialize Web Speech API
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return;
    }
    
    recognition.current = new window.webkitSpeechRecognition();
    recognition.current.continuous = true;
    recognition.current.interimResults = true;
    recognition.current.lang = language;
    
    recognition.current.onresult = (event) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
          // Check for filler words
          checkForFillerWords(transcript);
        } else {
          interim += transcript;
        }
      }
      
      if (final) {
        setTranscript(prev => prev + final + ' ');
        if (onTranscriptUpdate) {
          onTranscriptUpdate(prev => prev + final + ' ', 'final');
        }
      }
      
      setInterimTranscript(interim);
      if (onTranscriptUpdate && interim) {
        onTranscriptUpdate(interim, 'interim');
      }
      
      // Reset silence detection timer when we get results
      resetSilenceTimer();
    };
    
    recognition.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
    };
    
    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      clearTimeout(silenceTimer.current);
      clearInterval(audioLevelTimer.current);
      stopAudioMonitoring();
    };
  }, [language, onTranscriptUpdate]);
  
  // Function to check for filler words
  const checkForFillerWords = (text) => {
    if (!onFillerWord) return;
    
    const words = text.toLowerCase().split(' ');
    for (const word of words) {
      if (fillerWords.includes(word.trim())) {
        onFillerWord(word);
        break;
      }
    }
  };
  
  // Initialize audio monitoring for volume detection
  const startAudioMonitoring = async () => {
    try {
      // Store stream at the component level to prevent it from being garbage collected
      let stream = null;
      
      // First get the stream before creating AudioContext to avoid race conditions
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        console.error('Error accessing microphone stream:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          console.error('Microphone permission denied');
        }
        return; // Exit early if we can't get the stream
      }
      
      // Only create AudioContext after successfully getting the stream
      // Close any existing audio contexts first
      if (audioContext.current) {
        try {
          await audioContext.current.close();
        } catch (e) {
          console.error('Error closing previous AudioContext:', e);
        }
      }
      
      try {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.error('Failed to create AudioContext:', error);
        return;
      }
      
      if (!audioContext.current) {
        console.error('Failed to create AudioContext');
        return;
      }
      
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 256;
      
      try {
        microphone.current = audioContext.current.createMediaStreamSource(stream);
        microphone.current.connect(analyser.current);
      } catch (error) {
        console.error('Failed to create media stream source:', error);
        stopAudioMonitoring();
        return;
      }
      
      // Start regular monitoring of audio levels
      clearInterval(audioLevelTimer.current);
      audioLevelTimer.current = setInterval(() => {
        checkAudioLevel();
      }, 100); // Check every 100ms

      const checkVolume = () => {
        if (!analyser.current || !isListening) return;
        
        try {
          const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
          analyser.current.getByteFrequencyData(dataArray);
          
          // Calculate volume
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          
          // Check if volume is too low
          if (average < 10 && isListening && onLowVolume) {
            onLowVolume();
          }
        } catch (error) {
          console.error('Error checking volume:', error);
        }
        
        if (isListening) {
          requestAnimationFrame(checkVolume);
        }
      };
      
      checkVolume();
    } catch (error) {
      console.error('Error in audio monitoring setup:', error);
      // If there's an error, make sure we clean up any partially initialized audio components
      stopAudioMonitoring();
    }
  };
  
  // Check and report audio level for visualization
  const checkAudioLevel = () => {
    if (!analyser.current || !isListening || !onAudioLevelChange) return;
    
    try {
      const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
      analyser.current.getByteFrequencyData(dataArray);
      
      // Calculate volume - normalized from 0-100
      const average = Math.min(100, Math.max(0, 
        (dataArray.reduce((a, b) => a + b, 0) / dataArray.length) * 2
      ));
      
      // Report the audio level
      onAudioLevelChange(average);
    } catch (error) {
      console.error('Error checking audio level:', error);
    }
  };
  
  const stopAudioMonitoring = () => {
    try {
      clearInterval(audioLevelTimer.current);
      
      if (microphone.current) {
        microphone.current.disconnect();
        microphone.current = null;
      }
      
      if (audioContext.current) {
        audioContext.current.close().catch(e => console.error('Error closing AudioContext:', e));
        audioContext.current = null;
      }
      
      analyser.current = null;
      
      // Reset audio level when stopped
      if (onAudioLevelChange) {
        onAudioLevelChange(0);
      }
    } catch (error) {
      console.error('Error cleaning up audio resources:', error);
    }
  };
  
  // Start silence detection timer
  const startSilenceTimer = () => {
    silenceTimer.current = setTimeout(() => {
      if (onSilence && isListening) {
        onSilence();
      }
    }, 3000); // Detect silence after 3 seconds
  };
  
  // Reset silence detection timer
  const resetSilenceTimer = () => {
    clearTimeout(silenceTimer.current);
    startSilenceTimer();
  };
  
  const startListening = () => {
    setTranscript('');
    setInterimTranscript('');
    setIsListening(true);
    
    try {
      recognition.current.start();
      startAudioMonitoring();
      startSilenceTimer();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  };
  
  const stopListening = () => {
    setIsListening(false);
    if (recognition.current) {
      recognition.current.stop();
    }
    clearTimeout(silenceTimer.current);
    clearInterval(audioLevelTimer.current);
    stopAudioMonitoring();
  };
  
  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening
  };
};

export default TranscriptionHandler; 