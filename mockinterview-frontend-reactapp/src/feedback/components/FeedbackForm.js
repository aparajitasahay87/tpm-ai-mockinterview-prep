import React, { useState, useEffect, useRef } from 'react';
import { getAIAnalysisWithToken, saveFeedbackWithToken } from '../services/feedbackService';

function FeedbackForm({ selectedCategory, selectedQuestion }) {
  const [answer, setAnswer] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef(null);

  // Clear feedback & answer if question or category changes
  useEffect(() => {
    setAnswer('');
    setAiFeedback(null);
    clearCanvas();
  }, [selectedQuestion, selectedCategory]);

  // Basic canvas setup based on category (can be extended)
  useEffect(() => {
    if (!selectedCategory) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Example: Different canvas style depending on category
    if (selectedCategory.name.toLowerCase().includes('system design')) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      // Optionally draw grid or initial diagram base here
    } else if (selectedCategory.name.toLowerCase().includes('coding')) {
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
    }
  }, [selectedCategory]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Basic drawing on canvas with mouse (optional)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;

    const startDrawing = (e) => {
      drawing = true;
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };
    const draw = (e) => {
      if (!drawing) return;
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    };
    const stopDrawing = () => {
      drawing = false;
      ctx.closePath();
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
    };
  }, [selectedCategory]);

  const handleGetFeedback = async () => {
    setLoading(true);
    setAiFeedback(null);
    try {
      // Combine answer + canvas data as needed
      // For now, only sending answer text to backend
      const feedback = await getAIAnalysisWithToken({ 
        question: selectedQuestion.text, 
        answer, 
        category: selectedCategory.name 
      }, localStorage.getItem('appToken'));
      setAiFeedback(feedback);
    } catch (error) {
      alert('Failed to get AI feedback: ' + error.message);
    }
    setLoading(false);
  };

  const handleSaveResponse = async () => {
    setSaving(true);
    try {
      // You can also send canvas image data if needed
      await saveFeedbackWithToken({
        question: selectedQuestion.text,
        answer,
        category: selectedCategory.name,
        feedback: aiFeedback,
      }, localStorage.getItem('appToken'));
      alert('Response saved successfully!');
    } catch (error) {
      alert('Failed to save response: ' + error.message);
    }
    setSaving(false);
  };

  return (
    <div>
      <h3>{selectedQuestion.text}</h3>

      <textarea
        placeholder="Write your answer here..."
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        rows={6}
        cols={60}
      />

      <div>
        <canvas
          ref={canvasRef}
          width={500}
          height={300}
          style={{ border: '1px solid #ccc', marginTop: '10px' }}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={handleGetFeedback} disabled={loading || !answer.trim()}>
          {loading ? 'Getting Feedback...' : 'Get Feedback'}
        </button>

        {aiFeedback && (
          <div style={{ marginTop: 10, padding: 10, border: '1px solid green', backgroundColor: '#f0fff0' }}>
            <strong>AI Feedback:</strong>
            <pre>{JSON.stringify(aiFeedback, null, 2)}</pre>
          </div>
        )}

        {aiFeedback && (
          <button onClick={handleSaveResponse} disabled={saving}>
            {saving ? 'Saving...' : 'Save Response'}
          </button>
        )}
      </div>
    </div>
  );
}

export default FeedbackForm;
