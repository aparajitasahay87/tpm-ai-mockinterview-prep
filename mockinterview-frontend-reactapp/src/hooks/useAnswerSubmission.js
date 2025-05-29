// src/hooks/useAnswerSubmission.js
import { useState, useCallback } from 'react';
import { getAIAnalysisWithToken, saveFeedbackWithToken } from '../feedback/services/feedbackService';

export const useAnswerSubmission = (questionId, userAnswer) => {
  const [submitStatus, setSubmitStatus] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [detailedFeedback, setDetailedFeedback] = useState(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Modify handleSubmitAnswer to accept diagramData, timeSpent, and wordCount
  const handleSubmitAnswer = useCallback(async (diagramData = null, timeSpentSeconds = 0, wordCount = 0) => {
    if (!userAnswer.trim()) {
      setSubmitStatus('Please enter an answer.');
      return;
    }
    setSubmitStatus('Submitting...');
    setAiFeedback(null);
    setShowSaveButton(false);
    setSaveStatus('');

    try {
      const customAppToken = localStorage.getItem('appToken');
      if (!customAppToken) {
        console.error('No custom appToken found in localStorage. User might not be fully authenticated with your backend.');
        setSubmitStatus('Authentication failed. Please log in again.');
        return;
      }

      const feedbackPayload = {
        questionId: questionId,
        userAnswer: userAnswer,
        diagramData: diagramData, // Include diagram data
        timeSpentSeconds: timeSpentSeconds, // ⭐ Add time spent ⭐
        wordCount: wordCount, // ⭐ Add word count ⭐
      };

      const aiResponseData = await getAIAnalysisWithToken(feedbackPayload, customAppToken);

      setAiFeedback(aiResponseData.overallFeedback);
      setDetailedFeedback(aiResponseData.detailedFeedback);
      setSubmitStatus('Feedback received successfully!');
      setShowSaveButton(true);

    } catch (err) {
      console.error('Frontend: Error submitting answer or getting feedback from backend:', err);
      setSubmitStatus(`Failed to get AI feedback: ${err.message || 'Unknown error'}`);
      setAiFeedback('Sorry, an error occurred while getting feedback. Please try again later.');
      setShowSaveButton(false);
    }
  }, [questionId, userAnswer]); // Depend on questionId and userAnswer

  // Modify handleSaveResponse to accept timeSpent and wordCount if needed for saving
  const handleSaveResponse = useCallback(async (timeSpentSeconds = 0, wordCount = 0) => {
    if (!userAnswer.trim() || !aiFeedback || !detailedFeedback) {
      setSaveStatus('Cannot save: Answer or feedback is missing.');
      return;
    }

    setSaveStatus('Saving...');
    try {
      const customAppToken = localStorage.getItem('appToken');
      if (!customAppToken) {
        console.error('No custom appToken found in localStorage. User might not be fully authenticated with your backend.');
        setSaveStatus('Authentication failed. Please log in again to save.');
        return;
      <button onClick={handleSaveResponse} className="secondary-btn" style={{ marginLeft: '10px' }}>
          Save Response
      </button>
      }

      await saveFeedbackWithToken(
        userAnswer,
        aiFeedback,
        customAppToken,
        questionId,
        detailedFeedback,
        // ⭐ Pass timeSpent and wordCount to saveFeedbackWithToken if your backend requires it ⭐
        timeSpentSeconds,
        wordCount
      );
      setSaveStatus('Response saved successfully!');
      console.log('User response and detailed AI analysis saved successfully to ai_feedback!');
      setShowSaveButton(false);
    } catch (saveError) {
      console.error('Error saving user response and AI analysis:', saveError);
      setSaveStatus(`Failed to save response: ${saveError.message || 'Unknown error'}`);
    }
  }, [userAnswer, aiFeedback, detailedFeedback, questionId]); // Depend on necessary values

  return {
    submitStatus,
    aiFeedback,
    detailedFeedback,
    showSaveButton,
    saveStatus,
    handleSubmitAnswer,
    handleSaveResponse,
  };
};