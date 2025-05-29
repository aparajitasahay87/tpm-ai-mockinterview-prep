// src/hooks/useQuestionDetails.js
import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getQuestionById } from '../questions/services/questionService'; // Path adjusted: Up one level from 'hooks' to 'src', then down to 'questions/services'

export const useQuestionDetails = () => {
  const { questionId } = useParams();
  const location = useLocation();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (questionId) {
      const passedQuestion = location.state?.questionData;

      if (passedQuestion && passedQuestion.question_id === questionId) {
        console.log('Frontend: Using question data from navigation state.');
        setQuestion(passedQuestion);
        setLoading(false);
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

  return { question, loading, error };
};