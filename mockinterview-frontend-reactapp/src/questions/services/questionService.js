// questionService.js
// ⭐⭐⭐ CRITICAL FIX: Use environment variables for API base URLs ⭐⭐⭐
const API_BASE = process.env.REACT_APP_QUESTION_API_URL;
const AUTH_API_BASE = process.env.REACT_APP_AUTH_API_URL; // Base URL for auth service

// Add checks to ensure they are defined (good practice)
if (!API_BASE) {
  console.error("REACT_APP_QUESTION_API_URL is not defined. Check your .env file or Render environment variables.");
  throw new Error("Question API URL not configured.");
}
if (!AUTH_API_BASE) {
  console.error("REACT_APP_AUTH_API_URL is not defined. Check your .env file or Render environment variables.");
  throw new Error("Authentication API URL not configured.");
}


// Get fresh token each time to avoid using stale tokens
const getAuthHeaders = () => {
  const token = localStorage.getItem('appToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper function to handle token refresh
const handleTokenRefresh = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        console.error('No refresh token available to refresh.');
      throw new Error('No refresh token available');
    }
    
    const res = await fetch(`${AUTH_API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!res.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await res.json();
    localStorage.setItem('appToken', data.token);
    console.log('Token refreshed and saved to localStorage (key: "appToken")');
    
    // Optional: update refresh token if the server provides a new one
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
      console.log('Token refreshed and saved to localStorage (key: "appToken")');
    }
    
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Redirect to login page or show login modal
    window.location.href = '/login';
    return false;
  }
};

// Wrapper for API calls with token refresh functionality
const apiCall = async (url, options = {}) => {
  try {
    // Always use fresh headers
    const headers = getAuthHeaders();
    const res = await fetch(url, { 
      ...options, 
      headers: { ...headers, ...(options.headers || {}) } 
    });
    
    if (res.status === 401) {
      // Token likely expired, try to refresh
      const refreshed = await handleTokenRefresh();
      if (refreshed) {
        // Retry with new token
        const newHeaders = getAuthHeaders();
        const retryRes = await fetch(url, { 
          ...options, 
          headers: { ...newHeaders, ...(options.headers || {}) } 
        });
        
        if (!retryRes.ok) {
          const errorText = await retryRes.text();
          console.error('Server response after token refresh:', errorText);
          throw new Error(getErrorMessage(retryRes.status));
        }
        
        return retryRes.json();
      }
      // If refresh failed, the redirect in handleTokenRefresh will take over
      throw new Error('Authentication failed');
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Server response:', errorText);
      throw new Error(getErrorMessage(res.status));
    }
    
    return res.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Helper to provide user-friendly error messages
const getErrorMessage = (statusCode) => {
  switch (statusCode) {
    case 400: return 'Bad request. Please check your input.';
    case 401: return 'Authentication failed. Please log in again.';
    case 403: return 'You do not have permission to access this resource.';
    case 404: return 'The requested resource was not found.';
    case 500: return 'Server error. Please try again later.';
    default: return 'An error occurred. Please try again.';
  }
};

export const getCategories = async () => {
  return apiCall(`${API_BASE}/questions/categories`);
};

//export const getQuestionsByCategory = async (categoryId) => {
  //return apiCall(`${API_BASE}/categories/${categoryId}/questions`);
//};
export const getQuestionsByCategory = async (categoryId) => {
  return apiCall(`${API_BASE}/questions/categories/${categoryId}/questions`);
};

export const getQuestionById = async (questionId) => {
    // Ensure this URL matches your backend route defined in routes/questionRoutes.js
    // Based on server.js: app.use('/api', questionRoutes);
    return apiCall(`${API_BASE}/questions/${questionId}`);
};


export const submitAnswer = async (questionId, answer) => {
  return apiCall(`${API_BASE}/questions/${questionId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer })
  });
};