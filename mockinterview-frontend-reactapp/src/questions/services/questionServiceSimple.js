const API_BASE = 'http://localhost:3001/api';

// Get fresh token each time to avoid using stale tokens

  const token = localStorage.getItem('appToken');
  

export const getCategories = async () => {
  console.log('JWT token at Question Service:', token);
  const res = await fetch(`${API_BASE}/categories`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text(); // Try to read what came back
    console.error('Server response (likely HTML):', errorText);
    throw new Error('Failed to fetch categories');
  }

  return res.json();
};


//export const getQuestionsByCategory = async (categoryId) => {
  //const res = await fetch(`${API_BASE}/categories/${categoryId}/questions`, {
    //headers: getAuthHeaders(),
  //});
  //if (!res.ok) throw new Error('Failed to fetch questions');
  //return res.json();
//};
