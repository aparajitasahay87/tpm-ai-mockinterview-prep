// src/components/UserAnswerSection.js
import React, { useState, useCallback } from 'react';

// Make sure to accept all the new props related to timer and word limit
function UserAnswerSection({
  userAnswer,
  setUserAnswer,
  submitStatus,
  handleSubmitAnswer, // This is the function from QuestionDetailPage that wraps useAnswerSubmission
  showSaveButton,
  handleSaveResponse, // This is the function from QuestionDetailPage that wraps useAnswerSubmission
  saveStatus,
  // ⭐ NEW PROPS FROM QuestionDetailPage ⭐
  seconds,
  isActive,
  hasStartedTimer,
  startTimer,
  stopTimer,
  formatTime,
  wordLimit, // Passed from QuestionDetailPage
  wordCount, // Passed from QuestionDetailPage
  setWordCount // Passed from QuestionDetailPage (for internal management)
}) {

  // We need a local handler for the textarea that also updates the word count
  // This will be passed down from QuestionDetailPage.
  const handleAnswerChange = useCallback((e) => {
    const text = e.target.value;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const currentWordCount = words.length;

    if (currentWordCount <= wordLimit) { // Use wordLimit prop
      setUserAnswer(text);
      setWordCount(currentWordCount);
    } else {
      if (wordCount >= wordLimit && currentWordCount > wordLimit) {
          return;
      }
      const truncatedText = words.slice(0, wordLimit).join(' ');
      setUserAnswer(truncatedText);
      setWordCount(wordLimit);
    }
  }, [wordLimit, wordCount, setUserAnswer, setWordCount]); // Add setUserAnswer, setWordCount as dependencies

  return (
    <div style={{ marginTop: '20px' }}> {/* Removed original UserAnswerSection wrapper div's margin-top if present */}

      {/* ⭐ Timer Controls and Display ⭐ */}
      <div style={{ marginBottom: '15px', fontSize: '1.1em', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
        Time Elapsed: {formatTime(seconds)}
        {!isActive && !hasStartedTimer && (
          <button onClick={startTimer} className="primary-btn" style={{ marginLeft: '20px', padding: '5px 15px', fontSize: '0.9em' }}>
            Start Timer
          </button>
        )}
        {isActive && (
          <button onClick={stopTimer} className="secondary-btn" style={{ marginLeft: '20px', padding: '5px 15px', fontSize: '0.9em' }}>
            Stop Timer
          </button>
        )}
        {!isActive && hasStartedTimer && (
          <button onClick={startTimer} className="primary-btn" style={{ marginLeft: '20px', padding: '5px 15px', fontSize: '0.9em' }}>
            Resume Timer
          </button>
        )}
      </div>

      <h4>Your Response:</h4>
      <textarea
        value={userAnswer}
        onChange={handleAnswerChange}
        rows="10"
        className="text-input"
        placeholder={`Type your answer here (max ${wordLimit} words)...`}
      ></textarea>
      {/* ⭐ Display Word Count ⭐ */}
      <p style={{ fontSize: '0.9em', color: wordCount > wordLimit ? 'red' : 'inherit' }}>
        Word Count: {wordCount} / {wordLimit}
      </p>
      <br />
      <button onClick={handleSubmitAnswer} className="primary-btn">Get AI Feedback</button>
      {submitStatus && <p style={{ marginTop: '10px', color: submitStatus.includes('Failed') ? 'red' : 'green' }}>{submitStatus}</p>}

      {showSaveButton && (
        <button onClick={handleSaveResponse} className="secondary-btn" style={{ marginLeft: '10px' }}>
          Save Response
        </button>
      )}
      {saveStatus && <p style={{ marginTop: '10px', color: saveStatus.includes('Failed') ? 'red' : 'green' }}>{saveStatus}</p>}
    </div>
  );
}

export default UserAnswerSection;