import React, { useEffect, useState } from 'react';
import { getCategories } from '../services/questionService';
import { useNavigate } from 'react-router-dom'; // ⭐ Import useNavigate ⭐

function CategoryList({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);
   const navigate = useNavigate(); // ⭐ Initialize useNavigate ⭐

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // ⭐ New function to handle going back ⭐
  const handleGoBack = () => {
    navigate(-1); // This navigates back one step in the browser history
  };

  return (
    <div className="page-section"> {/* Apply consistent page styling */}
      {/* ⭐ Back Button ⭐ */}
      <button 
        onClick={handleGoBack} 
        className="secondary-btn" // Use the secondary button style defined in App.css
        style={{ marginBottom: '20px' }} // Add some spacing below the button
      >
        &larr; Back
      </button>

      <h2>Select a Category</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}> {/* Basic styling for the list */}
        {categories.map((cat) => (
          <li key={cat.id} style={{ marginBottom: '10px' }}> {/* Spacing between list items */}
            {/* Apply primary-btn class for category buttons for consistent look */}
            <button 
              onClick={() => onSelectCategory(cat)} 
              className="primary-btn" 
              style={{ width: '100%', maxWidth: '300px', padding: '15px 20px', fontSize: '1.1em' }} // Adjust size for better clickable area
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategoryList;
