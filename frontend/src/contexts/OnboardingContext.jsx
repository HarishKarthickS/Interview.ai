import React, { createContext, useState, useContext, useEffect } from 'react';

const OnboardingContext = createContext();

export const OnboardingProvider = ({ children }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  
  // Check if first visit
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    
    if (hasCompletedOnboarding === 'true') {
      setOnboardingCompleted(true);
    } else {
      // Auto-show onboarding for first-time users after a short delay
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const startOnboarding = () => {
    setShowOnboarding(true);
  };
  
  const completeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
    localStorage.setItem('onboardingCompleted', 'true');
  };
  
  const skipOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
    localStorage.setItem('onboardingCompleted', 'true');
  };
  
  const resetOnboarding = () => {
    setOnboardingCompleted(false);
    localStorage.removeItem('onboardingCompleted');
  };
  
  return (
    <OnboardingContext.Provider
      value={{
        showOnboarding,
        onboardingCompleted,
        startOnboarding,
        completeOnboarding,
        skipOnboarding,
        resetOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export default OnboardingContext; 