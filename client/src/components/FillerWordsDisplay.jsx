import React, { useState, useEffect } from 'react';
import FillerWordsAnalyzer from '../utils/fillerWordsAnalyzer';
import './FillerWords.css';

const FillerWordsDisplay = ({ transcript, showSummary = true }) => {
  const [analysis, setAnalysis] = useState(null);
  const [fillerAnalyzer] = useState(() => new FillerWordsAnalyzer());
  
  useEffect(() => {
    if (transcript) {
      const result = fillerAnalyzer.analyzeTranscript(transcript);
      setAnalysis(result);
    } else {
      setAnalysis(null);
    }
  }, [transcript, fillerAnalyzer]);
  
  if (!analysis || !transcript) {
    return null;
  }
  
  // Get density level for styling
  const getDensityLevel = (density) => {
    if (density < 3) return 'low';
    if (density < 8) return 'medium';
    return 'high';
  };
  
  // Format density percentage
  const formatDensity = (density) => {
    return density.toFixed(1) + '%';
  };
  
  // Create sorted array of filler word occurrences
  const getTopFillerWords = (occurrences, limit = 10) => {
    return Object.entries(occurrences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  };
  
  // Render HTML with highlighted filler words
  const renderHighlightedText = () => {
    return { __html: analysis.highlightedText };
  };
  
  const densityLevel = getDensityLevel(analysis.density);
  const topWords = getTopFillerWords(analysis.occurrences);
  
  return (
    <div className="filler-words-container">
      {/* Transcript with highlighted filler words */}
      <div 
        className="transcript-with-highlights"
        dangerouslySetInnerHTML={renderHighlightedText()}
      />
      
      {/* Summary section */}
      {showSummary && analysis.count > 0 && (
        <div className="filler-words-summary">
          <div className="filler-words-header">
            <div className="filler-words-title">
              Filler Words Detected: {analysis.count}
            </div>
            <div className={`filler-words-density ${densityLevel}`}>
              Density: {formatDensity(analysis.density)}
            </div>
          </div>
          
          {topWords.length > 0 && (
            <>
              <div className="filler-words-subtitle">
                Most Common:
              </div>
              <div className="filler-words-list">
                {topWords.map(({ word, count }, index) => (
                  <div key={index} className="filler-word-item">
                    {word}
                    <span className="filler-word-count">{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          
          <div className="filler-words-tips">
            <p>
              {densityLevel === 'low' 
                ? 'Great job! You used very few filler words.' 
                : densityLevel === 'medium'
                  ? 'Try to reduce your use of filler words for clearer communication.'
                  : 'Your speech contains many filler words which can distract from your message.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FillerWordsDisplay; 