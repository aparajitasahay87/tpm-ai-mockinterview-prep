// src/questions/components/QuestionDetailPage.js
import React, { useRef, useEffect, useState } from 'react';
import { useParams, useLocation,useNavigate } from 'react-router-dom';
import { getQuestionById } from '../services/questionService'; // submitAnswer is not used here
import { getAIAnalysisWithToken, saveFeedbackWithToken } from '../../feedback/services/feedbackService';

// Import the WhiteboardCanvas component
import WhiteboardCanvas from '../../components/WhiteboardCanvas';
function QuestionDetailPage() {
  const { questionId } = useParams();
  const location = useLocation();
   const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [receivedDetailedFeedback, setReceivedDetailedFeedback] = useState(null); // To store the full detailed feedback
  const [showSaveButton, setShowSaveButton] = useState(false); // New state to control save button visibility
  const [saveStatus, setSaveStatus] = useState(''); // New state for save status

  // Ref for the WhiteboardCanvas component
  const whiteboardRef = useRef(null);
  const [hasDiagram, setHasDiagram] = useState(false);

  useEffect(() => {
    if (questionId) {
      const passedQuestion = location.state?.questionData;

      if (passedQuestion && passedQuestion.question_id === questionId) {
        console.log('Frontend: Using question data from navigation state.');
        setQuestion(passedQuestion);
        setLoading(false);
        console.log('Frontend: has_diagram from state:', passedQuestion.has_diagram);
      } else {
        setLoading(true);
        console.log('Frontend: Fetching question data from backend for ID:', questionId);
        getQuestionById(questionId)
          .then(data => {
            console.log('Frontend: Fetched question details from backend:', data);
            setQuestion(data);
            setLoading(false);
          })
          .catch(err => {
            console.error('Frontend: Error fetching question details from backend:', err);
            setError('Failed to load question details.');
            setLoading(false);
          });
      }
    }
  }, [questionId, location.state]);

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      setSubmitStatus('Please enter an answer.');
      return;
    }
    setSubmitStatus('Submitting...');
    setAiFeedback(null); // Clear previous feedback
    setShowSaveButton(false); // Hide save button until new feedback is received
    setSaveStatus(''); // Clear previous save status

    try {
      const customAppToken = localStorage.getItem('appToken');
      if (!customAppToken) {
        console.error('No custom appToken found in localStorage. User might not be fully authenticated with your backend.');
        setSubmitStatus('Authentication failed. Please log in again.');
        return;
      }

      const feedbackPayload = {
        questionId: question.question_id,
        userAnswer: userAnswer,
        //diagramData: diagramDataToSave, // Include the Tldraw drawing data here
      };

      // Call getAIAnalysisWithToken, it returns { overallFeedback, detailedFeedback }
      const aiResponseData = await getAIAnalysisWithToken(feedbackPayload, customAppToken);

      setAiFeedback(aiResponseData.overallFeedback); // Display overall feedback
      setReceivedDetailedFeedback(aiResponseData.detailedFeedback); // Store detailed feedback for saving
      setSubmitStatus('Feedback received successfully!');
      setShowSaveButton(true); // Show the save button after feedback is received

    } catch (err) {
      console.error('Frontend: Error submitting answer or getting feedback from backend:', err);
      setSubmitStatus(`Failed to get AI feedback: ${err.message || 'Unknown error'}`);
      setAiFeedback('Sorry, an error occurred while getting feedback. Please try again later.');
      setShowSaveButton(false); // Ensure save button is hidden on error
    }
  };

  const handleSaveResponse = async () => {
    if (!userAnswer.trim() || !aiFeedback || !receivedDetailedFeedback) {
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
      }

      await saveFeedbackWithToken(
        userAnswer,
        aiFeedback, // This is the overall text feedback (from state)
        customAppToken,
        question.question_id,
        receivedDetailedFeedback // The full detailed object (from state)
      );
      setSaveStatus('Response saved successfully!');
      console.log('User response and detailed AI analysis saved successfully to ai_feedback!');
      setShowSaveButton(false); // Optionally hide button after saving
    } catch (saveError) {
      console.error('Error saving user response and AI analysis:', saveError);
      setSaveStatus(`Failed to save response: ${saveError.message || 'Unknown error'}`);
    }
  };

  // ⭐ New function to handle going back ⭐
  const handleGoBack = () => {
    navigate(-1); // This navigates back one step to the Question List
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
    <div className="page-section"> {/* Apply page-section class for consistent styling */}
      {/* ⭐ Back Button ⭐ */}
      <button
        onClick={handleGoBack}
        className="secondary-btn" // Use the secondary button style from App.css
        style={{ marginBottom: '20px' }} // Add some spacing below the button
      >
        &larr; Back to Questions
      </button>

      <h2>Question Details</h2>
      <p>ID: {question.question_id}</p>
      {question.title && <h3>{question.title}</h3>}
      <p>{question.content}</p>
      <p>Difficulty: {question.difficulty_level}</p>
      {question.category_name && <p>Category: {question.category_name}</p>}

      {/* Text box for user response */}
      <div style={{ marginTop: '20px' }}> {/* Added margin-top for spacing */}
        <h4>Your Response:</h4>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          rows="10"
          className="text-input" // Add a class for consistent textarea styling from App.css
          placeholder="Type your answer here..."
        ></textarea>
        <br />
        <button onClick={handleSubmitAnswer} className="primary-btn">Get AI Feedback</button> {/* Apply primary-btn */}
        {submitStatus && <p style={{ marginTop: '10px', color: submitStatus.includes('Failed') ? 'red' : 'green' }}>{submitStatus}</p>}

        {/* Save Response Button (conditionally rendered) */}
        {showSaveButton && (
          <button onClick={handleSaveResponse} className="secondary-btn" style={{ marginLeft: '10px' }}> {/* Apply secondary-btn */}
            Save Response
          </button>
        )}
        {saveStatus && <p style={{ marginTop: '10px', color: saveStatus.includes('Failed') ? 'red' : 'green' }}>{saveStatus}</p>}
      </div>

      {/* Conditionally render WhiteboardCanvas */}
      {question.has_diagram && (
        <div style={{ marginTop: '30px' }}>
          <h4>Diagram Area:</h4>
          {/* Replace the placeholder div with your WhiteboardCanvas component */}
          <WhiteboardCanvas ref={whiteboardRef} /> {/* <-- YOUR ACTUAL WHITEBOARD COMPONENT GOES HERE */}
          <p>This question requires a diagram. Please use the whiteboard above.</p>
        </div>
      )}

      {/* Display AI Feedback */}
      {aiFeedback && (
        <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #28a745', borderRadius: '5px', backgroundColor: '#d4edda', color: '#155724' }}>
          <h4>AI Feedback:</h4>
          <p>{aiFeedback}</p>
        </div>
        )}
      {receivedDetailedFeedback && (
        <div style={{
            marginTop: '20px', // Added margin for spacing between overall and detailed
            padding: '15px',
            border: '1px solid #007bff', // Different border color for distinction
            borderRadius: '5px',
            backgroundColor: '#e6f7ff',
            color: '#0056b3'
        }}>
          <h4>Detailed AI Feedback:</h4> {/* New heading for detailed feedback */}
          {/* Using <pre> to preserve newlines and formatting from the AI's detailedFeedback */}
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
              {receivedDetailedFeedback}
          </pre>
        </div>
      )}


    </div>


  );
}

export default QuestionDetailPage;