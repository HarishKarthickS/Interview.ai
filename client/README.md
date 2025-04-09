# Interview.ai Frontend - Speech Processing Modules

This project implements the Speech Processing Modules for the Interview.ai application, focusing on speech recognition and transcript management using the WebKit Speech Recognition API.

## Features

### 1. Transcription Handler

- Uses Web Speech API (webkit Speech Recognition)
- Handles both interim and final transcripts
- Supports multiple languages
- Provides error handling for common speech recognition issues
- Manages noise detection and filtering

### 2. Transcript Manager

- Associates answers to specific questions
- Timestamps and structures transcript data
- Caches data for offline viewing and recovery
- Formats data for submission to API

## Components

### 1. Speech Recognition Hook (`useSpeechRecognition.js`)

A custom React hook that provides a clean interface to the WebKit Speech Recognition API with features like:

- Start/stop/reset voice recording
- Interim and final transcript management
- Language selection
- Error handling
- Timestamps for speech segments

### 2. Transcript Manager (`transcriptManager.js`)

A utility class that:

- Structures and organizes transcript data
- Associates transcripts with specific questions
- Manages session data (start/end times)
- Provides local storage caching
- Formats data for API submission

### 3. UI Components

- **TranscriptionViewer**: Displays real-time transcription with controls
- **Interview**: Manages the interview flow with questions and navigation
- **InterviewPage**: Example implementation of a complete interview experience

## Getting Started

### Prerequisites

- Modern browser that supports the Web Speech API (Chrome, Edge, Safari)
- Node.js and npm

### Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm start
   ```

## Usage

To use the Speech Processing Modules in your own components:

```jsx
import useSpeechRecognition from './hooks/useSpeechRecognition';
import TranscriptManager from './utils/transcriptManager';

// In your component:
const { 
  transcript, 
  startListening, 
  stopListening 
} = useSpeechRecognition({
  language: 'en-US',
  continuous: true
});

// Create a transcript manager instance
const transcriptManager = new TranscriptManager();

// Start a session
transcriptManager.startSession();

// Set current question
transcriptManager.setCurrentQuestion(1, "Tell me about yourself");

// Add transcript data
transcriptManager.addTranscriptSegment({
  text: "Hello, my name is...",
  startTime: 1621500000000,
  endTime: 1621500005000
});

// Get formatted data for submission
const formattedData = transcriptManager.getFormattedTranscriptForSubmission();
```

## Browser Compatibility

The WebKit Speech Recognition API works best in:
- Google Chrome (desktop & mobile)
- Microsoft Edge
- Safari (macOS & iOS)

## Known Limitations

- Speech recognition requires an internet connection for most implementations
- Recognition quality varies by language
- Background noise can affect recognition accuracy
- Some browsers may require HTTPS for access to the microphone 