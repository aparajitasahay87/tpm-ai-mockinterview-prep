// src/hooks/useTimer.js
import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = () => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false); // Controls if timer is counting
  const [hasStartedTimer, setHasStartedTimer] = useState(false); // Tracks if timer has ever been started
  const timerRef = useRef(null); // Ref to hold the interval ID

  // Effect to manage the setInterval
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    } else {
      // If timer is not active, clear any existing interval
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null; // Clear the ref
      }
    }

    // Cleanup function for this effect: clear interval when component unmounts or isActive changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]); // Dependency array: re-run this effect when isActive changes

  // Start Timer handler
  const startTimer = useCallback(() => {
    if (!isActive) { // Only start if not already active
      setIsActive(true);
      setHasStartedTimer(true);
    }
  }, [isActive]);

  // Stop Timer handler
  const stopTimer = useCallback(() => {
    if (isActive) { // Only stop if currently active
      setIsActive(false);
    }
  }, [isActive]);

  // Reset Timer handler (optional, but good to have)
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setSeconds(0);
    setHasStartedTimer(false);
  }, []);

  // Helper function to format time
  const formatTime = useCallback((totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }, []);

  return {
    seconds,
    isActive,
    hasStartedTimer,
    startTimer,
    stopTimer,
    resetTimer,
    formatTime,
  };
};