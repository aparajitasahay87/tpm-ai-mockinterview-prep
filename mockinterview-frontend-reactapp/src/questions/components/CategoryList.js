import React, { useEffect, useState } from 'react';
import { getCategories } from '../questions/services/questionService'; // Corrected path based on previous context
import { useNavigate } from 'react-router-dom';

function CategoryList({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(''); // ⭐ Added error state
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(''); // ⭐ Clear any previous errors
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) { // ⭐ Changed error to err for consistency with previous snippets
        console.error('Failed to load categories:', err);
        setError('Failed to load categories: ' + err.message); // ⭐ Set error message
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ⭐ New function to handle going back ⭐
  const handleGoBack = () => {
    navigate(-1); // This navigates back one step in the browser history
  };

  // ⭐ Integrated handleCategoryClick from the immersive ⭐
  const handleCategoryClick = (category) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    } else {
      navigate(`/questions?categoryId=${category.category_id}`); // ⭐ Use category_id for consistency
    }
  };

  return (
    <div className="page-section container mx-auto p-4"> {/* Apply consistent page styling, added Tailwind container classes */}
      {/* ⭐ Back Button ⭐ */}
      <button
        onClick={handleGoBack}
        className="secondary-btn bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg shadow hover:bg-gray-300 transition-colors mb-5" // Added Tailwind for secondary-btn style
      >
        &larr; Back
      </button>

      <h2 className="text-2xl font-bold mb-4">Select a Category</h2>
      {isLoading ? ( // ⭐ Conditional rendering for loading state
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">Loading interview categories...</p>
          {/* Simple spinner using Tailwind classes */}
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mt-4"></div>
        </div>
      ) : error ? ( // ⭐ Display error message if fetching failed
        <p className="text-red-500 text-center py-8">{error}</p>
      ) : categories.length > 0 ? ( // ⭐ Display categories if loaded successfully
        <ul style={{ listStyle: 'none', padding: 0 }}> {/* Basic styling for the list */}
          {categories.map((cat) => (
            <li key={cat.category_id} style={{ marginBottom: '10px' }}> {/* ⭐ Changed key to category_id */}
              {/* Apply primary-btn class for category buttons with Tailwind styling */}
              <button
                onClick={() => handleCategoryClick(cat)}
                className="primary-btn bg-blue-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-600 transition-transform transform hover:-translate-y-1"
                style={{ width: '100%', maxWidth: '300px', padding: '15px 20px', fontSize: '1.1em', display: 'block', margin: '0 auto' }} // Adjust size for better clickable area, center button
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      ) : ( // ⭐ Message if no categories are found after loading
        <p className="text-gray-600 text-center py-8">No categories available at the moment.</p>
      )}
    </div>
  );
}

export default CategoryList;
