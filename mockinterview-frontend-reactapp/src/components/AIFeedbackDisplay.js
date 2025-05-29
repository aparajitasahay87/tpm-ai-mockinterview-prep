// src/components/AIFeedbackDisplay.js
import React from 'react';

function AIFeedbackDisplay({ aiFeedback, detailedFeedback }) {
  if (!aiFeedback && !detailedFeedback) {
    return null; // Don't render anything if no feedback
  }

  return (
    <>
      {aiFeedback && (
        <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #28a745', borderRadius: '5px', backgroundColor: '#d4edda', color: '#155724' }}>
          <h4>AI Feedback:</h4>
          <p>{aiFeedback}</p>
        </div>
      )}
      {detailedFeedback && (
        <div style={{
            marginTop: '20px',
            padding: '15px',
            border: '1px solid #007bff',
            borderRadius: '5px',
            backgroundColor: '#e6f7ff',
            color: '#0056b3'
        }}>
          <h4>Detailed AI Feedback:</h4>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
              {detailedFeedback}
          </pre>
        </div>
      )}
    </>
  );
}

export default AIFeedbackDisplay;