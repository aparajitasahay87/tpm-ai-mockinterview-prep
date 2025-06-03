

export const getAIAnalysisWithToken = async (payload, appToken) => {

    console.log("Frontend Feedback Service: Sending to backend:", payload);
    //const API_BASE_URL = 'http://localhost:5000/api';
     const API_BASE_URL = 'https://feedback-service-krjy.onrender.com'; // 👈 Make sure this matches your backend
  try {
    const result = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appToken}`,
      },
      body: JSON.stringify( payload ),
    });

    if (!result.ok) {
      let errorMessage = 'Error occurred while fetching feedback';
      try {
        const errorData = await result.json();
        if (errorData?.message) {
          errorMessage = `Error fetching feedback: ${errorData.message}`;
        } else {
          errorMessage = `Error fetching feedback: Status ${result.status}`;
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    const data = await result.json();
    console.log('Feedback from backend:', data);
    return data;
  } catch (error) {
    console.error('Frontend Feedback Service: Error fetching AI feedback:', error);
    throw new Error('Failed to connect to the server');
  }
};

export const saveFeedbackWithToken = async (userAnswer, overallAiFeedback, appToken, questionId, detailedAiFeedback) => {
  const API_BASE_URL = 'http://localhost:5000/api'; // response-service

  console.log("Frontend Feedback Service: Saving user response and detailed AI feedback to ai_feedback table.");

  try {
        const payload = {
            questionId: questionId,
            userAnswer: userAnswer,
            overallAiFeedback: overallAiFeedback, // The overall text feedback
            detailedAiFeedback: detailedAiFeedback // The full detailed object
        };

    const result = await fetch(`${API_BASE_URL}/feedback/save-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      let errorMessage = 'Failed to save feedback';
      try {
        const errorData = await result.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Error parsing backend error:', e);
      }
      throw new Error(errorMessage);
    }

    const data = result.json(); // or just return true for success
     console.log("Frontend Feedback Service: Feedback saved successfully to ai_feedback:", data);
        return data;
  } catch (error) {
    console.error('Frontend Feedback Service: Error saving feedback:', error);
    throw error;
  }
};
