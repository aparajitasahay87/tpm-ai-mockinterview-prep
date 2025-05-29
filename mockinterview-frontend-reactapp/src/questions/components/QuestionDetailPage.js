// src/questions/components/QuestionDetailPage.js
import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQuestionDetails } from '../../hooks/useQuestionDetails';
import { useAnswerSubmission } from '../../hooks/useAnswerSubmission';
import { useTimer } from '../../hooks/useTimer'; // ⭐ Import useTimer ⭐

import WhiteboardCanvas from '../../components/WhiteboardCanvas';
import UserAnswerSection from '../../components/UserAnswerSection'; // ⭐ KEEP THIS IMPORT ⭐
import AIFeedbackDisplay from '../../components/AIFeedbackDisplay';

function QuestionDetailPage() {
  const navigate = useNavigate();

  const { question, loading, error } = useQuestionDetails();
  const [userAnswer, setUserAnswer] = useState('');

  // ⭐ Timer Hook ⭐
  const { seconds, isActive, hasStartedTimer, startTimer, stopTimer, formatTime } = useTimer();

  // ⭐ Word Count State & Limit ⭐
  const WORD_LIMIT = 500;
  const [wordCount, setWordCount] = useState(0); // This state will be managed by UserAnswerSection's prop

  const {
    submitStatus,
    aiFeedback,
    detailedFeedback,
    showSaveButton,
    saveStatus,
    handleSubmitAnswer: submitAnswerHook, // Rename to avoid conflict with local function
    handleSaveResponse: saveResponseHook, // Rename to avoid conflict with local function
  } = useAnswerSubmission(question?.question_id, userAnswer);

  const whiteboardRef = useRef(null);
  const hasDiagram = question?.has_diagram || false;

  // ⭐ Local handleSubmitAnswer that calls the hook's function with collected data ⭐
  const handleSubmitAnswer = async () => {
    // Stop the timer when the user submits
    if (hasStartedTimer) {
      stopTimer();
    }

    let diagramData = null;
    if (hasDiagram && whiteboardRef.current) {
      diagramData = whiteboardRef.current.getCurrentDrawingData();
      console.log("Collected Diagram Data:", diagramData);
    }
    // ⭐ Pass diagramData, seconds, and wordCount to the hook's submit function ⭐
    await submitAnswerHook(diagramData, seconds, wordCount);
  };

  // ⭐ Local handleSaveResponse that calls the hook's function with collected data ⭐
  const handleSaveResponse = async () => {
    // Optional: stop timer on save as well
    // if (hasStartedTimer) {
    //   stopTimer();
    // }
    // ⭐ Pass seconds and wordCount to the hook's save function ⭐
    await saveResponseHook(seconds, wordCount);
  };


  // The handleAnswerChange logic is now primarily in UserAnswerSection,
  // but if you have a top-level setter for userAnswer, you would pass it down.
  // The `UserAnswerSection` now manages `userAnswer` and `wordCount` internally,
  // but it needs `setUserAnswer` and `setWordCount` passed as props.

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <div>Loading question details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!question) {
    return <div>Question not found.</div>;
  }

  return (
    <div className="page-section">
      <button
        onClick={handleGoBack}
        className="secondary-btn"
        style={{ marginBottom: '20px' }}
      >
        &larr; Back to Questions
      </button>

      <h2>Question Details</h2>
      <p>ID: {question.question_id}</p>
      {question.title && <h3>{question.title}</h3>}
      <p>{question.content}</p>
      <p>Difficulty: {question.difficulty_level}</p>
      {question.category_name && <p>Category: {question.category_name}</p>}

      {/* NEW FLEX CONTAINER FOR TEXT AREA AND WHITEBOARD */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>

        {/* User Answer Section (Left/Top Part) */}
        <div style={{ flex: '1 1 500px', minWidth: '300px' }}> {/* Flex item for answer section */}
          {/* ⭐ Pass ALL necessary props to UserAnswerSection ⭐ */}
          <UserAnswerSection
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer} // Pass the setter for userAnswer
            submitStatus={submitStatus}
            handleSubmitAnswer={handleSubmitAnswer} // Pass the local wrapper function
            showSaveButton={showSaveButton}
            handleSaveResponse={handleSaveResponse} // Pass the local wrapper function
            saveStatus={saveStatus}
            // Timer related props
            seconds={seconds}
            isActive={isActive}
            hasStartedTimer={hasStartedTimer}
            startTimer={startTimer}
            stopTimer={stopTimer}
            formatTime={formatTime}
            // Word limit related props
            wordLimit={WORD_LIMIT}
            wordCount={wordCount}
            setWordCount={setWordCount} // Pass the setter for wordCount
          />
        </div>

        {/* Conditionally render WhiteboardCanvas (Right/Bottom Part) */}
        {hasDiagram && (
          <div style={{ flex: '1 1 500px', minWidth: '300px' }}> {/* Flex item for diagram */}
            <h4>Diagram Area:</h4>
            <WhiteboardCanvas ref={whiteboardRef} />
            <p style={{ marginTop: '10px' }}>This question requires a diagram. Please use the whiteboard above.</p>
          </div>
        )}
      </div> {/* End of NEW FLEX CONTAINER */}

      {/* AI Feedback Display - place this below the flex container */}
      <AIFeedbackDisplay
        aiFeedback={aiFeedback}
        detailedFeedback={detailedFeedback}
      />
    </div>
  );
}

export default QuestionDetailPage;