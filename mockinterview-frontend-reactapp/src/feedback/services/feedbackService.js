

const FEEDBACK_API_BASE_URL = process.env.REACT_APP_FEEDBACK_API_URL;

if (!FEEDBACK_API_BASE_URL) {
  console.error("REACT_APP_FEEDBACK_API_URL is not defined. Check your .env file or Render environment variables.");
  throw new Error("Feedback API URL not configured.");
}
export const getAIAnalysisWithToken = async (payload, appToken) => {
    console.log("Frontend Feedback Service: Sending to backend:", payload);
  try {
    const result = await fetch(`${FEEDBACK_API_BASE_URL}/feedback`, {
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
  

  try {
        const payload = {
            questionId: questionId,
            userAnswer: userAnswer,
            overallAiFeedback: overallAiFeedback, // The overall text feedback
            detailedAiFeedback: detailedAiFeedback // The full detailed object
        };

    const result = await fetch(`${FEEDBACK_API_BASE_URL}/feedback/save-response`, {
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
