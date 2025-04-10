import './App.css'
import SpeechProcessor from './components/SpeechProcessor'
import Results from './pages/Results'
import './components/SpeechProcessor.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Sample interview questions
const interviewQuestions = [
  "Tell me about yourself and your background.",
  "What are your greatest strengths and weaknesses?",
  "Why are you interested in this position?",
  "Describe a challenging situation at work and how you handled it.",
  "What are your salary expectations?",
  "Where do you see yourself in 5 years?",
  "Do you have any questions for me?"
];

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="app-backdrop"></div>
        <Routes>
          <Route path="/" element={<SpeechProcessor questions={interviewQuestions} />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
