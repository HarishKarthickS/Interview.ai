/**
 * Filler Words Analyzer
 * 
 * Analyzes transcripts to detect common filler words and speech patterns
 */
class FillerWordsAnalyzer {
  constructor(options = {}) {
    // Common filler words in English
    this.fillerWords = options.fillerWords || [
      'um', 'uh', 'er', 'ah', 'like', 'basically', 'literally',
      'actually', 'you know', 'i mean', 'so', 'right', 'well',
      'kind of', 'sort of', 'just', 'okay', 'hmm', 'yeah'
    ];
    
    // Create regex pattern for filler words
    const escapedWords = this.fillerWords.map(word => 
      word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    this.fillerWordsRegex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
  }

  /**
   * Analyze a transcript for filler words
   * @param {string} transcript - The text to analyze
   * @returns {object} Analysis results
   */
  analyzeTranscript(transcript) {
    if (!transcript || typeof transcript !== 'string') {
      return {
        fillerWords: [],
        count: 0,
        density: 0,
        text: ''
      };
    }
    
    // Find all matches
    const matches = [...transcript.matchAll(this.fillerWordsRegex)];
    
    // Get total word count
    const totalWords = transcript.split(/\s+/).filter(word => word.length > 0).length;
    
    // Calculate filler word density
    const density = totalWords > 0 ? (matches.length / totalWords) * 100 : 0;
    
    // Create a list of found filler words with their positions
    const fillerWords = matches.map(match => ({
      word: match[0],
      position: match.index,
      length: match[0].length
    }));
    
    // Count occurrences of each filler word
    const occurrences = {};
    fillerWords.forEach(item => {
      const word = item.word.toLowerCase();
      occurrences[word] = (occurrences[word] || 0) + 1;
    });
    
    // Generate highlighted text
    const highlightedText = this.generateHighlightedText(transcript, fillerWords);
    
    return {
      fillerWords,
      occurrences,
      count: matches.length,
      totalWords,
      density,
      highlightedText
    };
  }
  
  /**
   * Generate HTML text with filler words highlighted
   * @param {string} text - Original text
   * @param {array} fillerWords - Array of filler word objects with positions
   * @returns {string} HTML with highlights
   */
  generateHighlightedText(text, fillerWords) {
    if (!text || !fillerWords.length) return text;
    
    // Sort by position to process from end to beginning
    const sortedWords = [...fillerWords].sort((a, b) => b.position - a.position);
    
    let result = text;
    
    // Replace each filler word with a highlighted version
    sortedWords.forEach(({ word, position, length }) => {
      const before = result.substring(0, position);
      const after = result.substring(position + length);
      result = `${before}<span class="filler-word">${word}</span>${after}`;
    });
    
    return result;
  }
  
  /**
   * Get a list of filler words being detected
   * @returns {array} List of filler words
   */
  getFillerWordsList() {
    return [...this.fillerWords];
  }
  
  /**
   * Add custom filler words to the detector
   * @param {array} words - Array of words to add
   */
  addCustomFillerWords(words) {
    if (!Array.isArray(words)) return;
    
    // Add new unique words
    words.forEach(word => {
      if (typeof word === 'string' && !this.fillerWords.includes(word.toLowerCase())) {
        this.fillerWords.push(word.toLowerCase());
      }
    });
    
    // Rebuild the regex
    const escapedWords = this.fillerWords.map(word => 
      word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    this.fillerWordsRegex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
  }
}

export default FillerWordsAnalyzer; 