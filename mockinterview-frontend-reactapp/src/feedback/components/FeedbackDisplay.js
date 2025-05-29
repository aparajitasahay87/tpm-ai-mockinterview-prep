const FeedbackDisplay = ({ feedback }) => {
  if (!feedback) return null; // Don't show anything if no feedback

  return (
    <div style={{
      backgroundColor: '#f7f7f7',
      border: '1px solid #ddd',
      padding: 15,
      borderRadius: 5,
      whiteSpace: 'pre-wrap',
      marginTop: 20,
    }}>
      <h3>AI Feedback:</h3>
      <p>{feedback}</p>
    </div>
  );
};

export default FeedbackDisplay;
