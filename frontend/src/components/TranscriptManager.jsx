import { useState, useCallback } from 'react';

const TranscriptManager = () => {
  const [transcripts, setTranscripts] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  
  // Add a new question entry or use existing one
  const setQuestion = useCallback((questionIndex, questionText) => {
    setTranscripts(prev => {
      const newTranscripts = [...prev];
      
      if (!newTranscripts[questionIndex]) {
        newTranscripts[questionIndex] = {
          question: questionText,
          answer: '',
          timestamps: {
            start: Date.now(),
            end: null
          },
          fillerWordCount: 0
        };
      } else {
        newTranscripts[questionIndex].question = questionText;
      }
      
      return newTranscripts;
    });
    
    setCurrentQuestionIndex(questionIndex);
  }, []);
  
  // Update answer for the current question
  const updateAnswer = useCallback((text, type = 'final') => {
    if (currentQuestionIndex === null) return;
    
    setTranscripts(prev => {
      const newTranscripts = [...prev];
      
      if (!newTranscripts[currentQuestionIndex]) {
        return prev;
      }
      
      if (type === 'final') {
        newTranscripts[currentQuestionIndex].answer = text;
        newTranscripts[currentQuestionIndex].timestamps.end = Date.now();
      }
      
      return newTranscripts;
    });
  }, [currentQuestionIndex]);
  
  // Record filler word usage
  const recordFillerWord = useCallback(() => {
    if (currentQuestionIndex === null) return;
    
    setTranscripts(prev => {
      const newTranscripts = [...prev];
      
      if (!newTranscripts[currentQuestionIndex]) {
        return prev;
      }
      
      newTranscripts[currentQuestionIndex].fillerWordCount += 1;
      
      return newTranscripts;
    });
  }, [currentQuestionIndex]);
  
  // Get transcript data for the current question
  const getCurrentTranscript = useCallback(() => {
    if (currentQuestionIndex === null || !transcripts[currentQuestionIndex]) {
      return null;
    }
    
    return transcripts[currentQuestionIndex];
  }, [currentQuestionIndex, transcripts]);
  
  // Get all transcript data
  const getAllTranscripts = useCallback(() => {
    return transcripts;
  }, [transcripts]);
  
  // Cache transcript data to localStorage
  const cacheTranscripts = useCallback(() => {
    try {
      localStorage.setItem('interview_transcripts', JSON.stringify(transcripts));
      return true;
    } catch (error) {
      console.error('Error caching transcripts:', error);
      return false;
    }
  }, [transcripts]);
  
  // Load cached transcript data from localStorage
  const loadCachedTranscripts = useCallback(() => {
    try {
      const cached = localStorage.getItem('interview_transcripts');
      if (cached) {
        const parsed = JSON.parse(cached);
        setTranscripts(parsed);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading cached transcripts:', error);
      return false;
    }
  }, []);
  
  // Clear transcript data
  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setCurrentQuestionIndex(null);
    localStorage.removeItem('interview_transcripts');
  }, []);
  
  return {
    setQuestion,
    updateAnswer,
    recordFillerWord,
    getCurrentTranscript,
    getAllTranscripts,
    cacheTranscripts,
    loadCachedTranscripts,
    clearTranscripts
  };
};

export default TranscriptManager; 