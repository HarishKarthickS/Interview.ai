/**
 * Transcript Manager
 * 
 * Handles and structures transcript data, associating answers with questions
 * and providing functionality for caching/persistence
 */
class TranscriptManager {
  constructor() {
    this.currentQuestionId = null;
    this.transcriptData = {
      questions: {}, // Structure: { questionId: { text, startTime, answers: [] } }
      currentSession: {
        startTime: null,
        endTime: null,
      }
    };
  }

  /**
   * Start a new interview session
   */
  startSession() {
    this.transcriptData.currentSession.startTime = Date.now();
    this.transcriptData.currentSession.endTime = null;
    
    // Clear previous session data
    this.transcriptData.questions = {};
    
    // Save to local storage for recovery
    this._saveToLocalStorage();
    
    return this.transcriptData.currentSession.startTime;
  }

  /**
   * End the current interview session
   */
  endSession() {
    this.transcriptData.currentSession.endTime = Date.now();
    this._saveToLocalStorage();
    return this.transcriptData;
  }

  /**
   * Set the current active question
   * @param {number} questionId - ID of the current question
   * @param {string} questionText - Text of the question
   */
  setCurrentQuestion(questionId, questionText) {
    this.currentQuestionId = questionId;
    
    // Initialize question data if it doesn't exist
    if (!this.transcriptData.questions[questionId]) {
      this.transcriptData.questions[questionId] = {
        text: questionText,
        startTime: Date.now(),
        answers: []
      };
    }
    
    this._saveToLocalStorage();
    return this.currentQuestionId;
  }

  /**
   * Add a transcript segment to the current question
   * @param {object} segment - Transcript segment with text and timestamps
   */
  addTranscriptSegment(segment) {
    if (!this.currentQuestionId) {
      console.error('No current question set');
      return false;
    }
    
    this.transcriptData.questions[this.currentQuestionId].answers.push({
      text: segment.text,
      startTime: segment.startTime,
      endTime: segment.endTime,
      confidence: segment.confidence || 0
    });
    
    this._saveToLocalStorage();
    return true;
  }

  /**
   * Add multiple transcript segments to the current question
   * @param {array} segments - Array of transcript segments
   */
  addTranscriptSegments(segments) {
    if (!this.currentQuestionId) {
      console.error('No current question set');
      return false;
    }
    
    if (!Array.isArray(segments)) {
      console.error('Segments must be an array');
      return false;
    }
    
    segments.forEach(segment => {
      this.addTranscriptSegment(segment);
    });
    
    return true;
  }

  /**
   * Get the full transcript for a specific question
   * @param {number} questionId - ID of the question to get transcript for
   */
  getQuestionTranscript(questionId) {
    if (!this.transcriptData.questions[questionId]) {
      return null;
    }
    
    const questionData = this.transcriptData.questions[questionId];
    const fullText = questionData.answers.map(answer => answer.text).join(' ');
    
    return {
      questionId,
      questionText: questionData.text,
      fullText,
      segments: questionData.answers,
      startTime: questionData.startTime
    };
  }

  /**
   * Get the full transcript for all questions
   */
  getAllTranscripts() {
    const result = [];
    
    Object.keys(this.transcriptData.questions).forEach(questionId => {
      result.push(this.getQuestionTranscript(questionId));
    });
    
    return result;
  }

  /**
   * Get the transcript data in a format ready for submission to the API
   */
  getFormattedTranscriptForSubmission() {
    const formatted = [];
    
    Object.keys(this.transcriptData.questions).forEach(questionId => {
      const question = this.transcriptData.questions[questionId];
      const answer = question.answers.map(a => a.text).join(' ');
      
      formatted.push({
        questionId: parseInt(questionId),
        answer,
        startTime: question.startTime,
        endTime: question.answers.length > 0 
          ? question.answers[question.answers.length - 1].endTime 
          : question.startTime
      });
    });
    
    return formatted;
  }

  /**
   * Save current transcript to local storage for recovery
   * @private
   */
  _saveToLocalStorage() {
    try {
      localStorage.setItem('interview_transcript', JSON.stringify(this.transcriptData));
    } catch (error) {
      console.error('Error saving transcript to local storage:', error);
    }
  }

  /**
   * Load transcript from local storage (for recovery)
   */
  loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem('interview_transcript');
      if (savedData) {
        this.transcriptData = JSON.parse(savedData);
        return true;
      }
    } catch (error) {
      console.error('Error loading transcript from local storage:', error);
    }
    return false;
  }

  /**
   * Clear local storage transcript data
   */
  clearLocalStorage() {
    try {
      localStorage.removeItem('interview_transcript');
      return true;
    } catch (error) {
      console.error('Error clearing transcript from local storage:', error);
      return false;
    }
  }
}

export default TranscriptManager; 