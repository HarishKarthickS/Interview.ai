import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faClock, faComments, faChartLine, faTimes } from '@fortawesome/free-solid-svg-icons';
import './OnboardingGuide.css';

const OnboardingGuide = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: faMicrophone,
      title: "Set Up Your Microphone",
      content: "Ensure your microphone is connected and working properly. You'll be asked to grant microphone permissions when you start the interview. Speak clearly and at a comfortable distance from your microphone for the best results."
    },
    {
      icon: faClock,
      title: "Timed Responses",
      content: "Your responses will be timed to simulate a real interview setting. Try to keep your answers concise yet comprehensive. The application will provide feedback on your response duration to help you improve."
    },
    {
      icon: faComments,
      title: "Speak Naturally",
      content: "Answer as if you're in a real interview. Use a professional tone and focus on articulating your thoughts clearly. Don't worry about minor mistakes—this is a practice environment designed to help you improve."
    },
    {
      icon: faChartLine,
      title: "Get Feedback",
      content: "After each answer, you'll receive instant feedback on the length and pace of your response. Use this feedback to refine your interview technique and become more confident in your answers."
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (index) => {
    setCurrentStep(index);
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="onboarding-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="onboarding-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="step-icon">
              <FontAwesomeIcon icon={steps[currentStep].icon} />
            </div>
            <h2>{steps[currentStep].title}</h2>
            <p>{steps[currentStep].content}</p>
          </motion.div>
        </AnimatePresence>
        
        <div className="step-indicators">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`step-dot ${index === currentStep ? 'active' : ''}`}
              onClick={() => goToStep(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
        
        <div className="onboarding-actions">
          <button 
            className="prev-btn" 
            onClick={prevStep} 
            disabled={currentStep === 0}
          >
            Previous
          </button>
          <button 
            className="next-btn" 
            onClick={nextStep}
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
        
        <button className="skip-btn" onClick={onClose}>
          Skip tutorial
        </button>
      </motion.div>
    </motion.div>
  );
};

export default OnboardingGuide; 