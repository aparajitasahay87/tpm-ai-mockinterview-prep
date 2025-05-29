// src/questions/componenets/QuestionsPage.js
import React, { useEffect, useState } from 'react';
import { useSearchParams , useNavigate} from 'react-router-dom';
import { getQuestionsByCategory } from '../services/questionService'; // Adjust the import path

function QuestionsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // Initialize useNavigate
  const categoryId = searchParams.get('categoryId');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (categoryId) {
      setLoading(true);
       console.log('Fetching questions for category ID:', categoryId);
      getQuestionsByCategory(categoryId)
        .then(data => {
          setQuestions(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching questions:', error);
          setError('Failed to load questions.');
          setLoading(false);
        });
    }
  }, [categoryId]);

  const handleQuestionClick = (question) => {
    navigate(`/question/${question.question_id}`, { state: { questionData: question } }); // Navigate to the new question detail page
  };

  // ⭐ New function to handle going back ⭐
  const handleGoBack = () => {
    navigate(-1); // This navigates back one step to the Category List
  };

  if (loading) {
    return <div>Loading questions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="page-section"> {/* Apply page-section class for consistent styling */}
      {/* ⭐ Back Button ⭐ */}
      <button
        onClick={handleGoBack}
        className="secondary-btn" // Use the secondary button style from App.css
        style={{ marginBottom: '20px' }} // Add some spacing
      >
        &larr; Back to Categories
      </button>

      <h2>Questions for Category ID: {categoryId}</h2>
      {questions.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}> {/* Basic styling for the list */}
          {questions.map(question => (
            <li
              key={question.question_id}
              onClick={() => handleQuestionClick(question)}
              style={{
                cursor: 'pointer',
                padding: '15px', // Increased padding for better click area
                marginBottom: '10px', // Spacing between items
                border: '1px solid #ddd', // Subtle border
                borderRadius: '8px', // Rounded corners
                backgroundColor: '#f9f9f9', // Light background
                transition: 'background-color 0.2s ease, transform 0.1s ease', // Smooth transition
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)' // Subtle shadow
              }}
              // Add hover effect using CSS (e.g., in App.css or a separate stylesheet)
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eef'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
            >
              {question.title || question.content}
            </li>
          ))}
        </ul>
      ) : (
        <p>No questions available for this category.</p>
      )}
    </div>
  );
}
export default QuestionsPage;