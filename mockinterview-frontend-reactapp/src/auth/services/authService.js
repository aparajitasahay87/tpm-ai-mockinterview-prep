export async function verifyFirebaseToken(firebaseToken) {
  // Use the environment variable for the backend URL
  const authApiUrl = process.env.REACT_APP_AUTH_API_URL;
  if (!authApiUrl) {
    console.error("REACT_APP_AUTH_API_URL is not defined. Check your .env file or Render environment variables.");
    throw new Error("Authentication API URL not configured.");
  }

  try {
    const response = await fetch(`${authApiUrl}/auth/verify-firebase`, { // Use the environment variable here
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseIdToken: firebaseToken }),
    });

    if (!response.ok) {
      console.error('Initial Firebase token exchange failed. Status:', response.status);
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to verify Firebase token with backend.');
    }

    const data = await response.json(); // This reads the response body
    console.log('Response data from backend:', data); // See what's inside

    const { appToken, refreshToken } = data; // Extract appToken and refreshToken from the response

    if (appToken) {
      localStorage.setItem('appToken', appToken);
      console.log('Custom AppToken saved to localStorage:', appToken);
    } else {
      console.error('Custom AppToken not found in YOUR backend response:', data);
      throw new Error('Authentication failed: No custom appToken received from backend.');
    }

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
      console.log('Refresh Token saved to localStorage:', refreshToken);
    } else {
      console.warn('No RefreshToken received from backend. Session might not be refreshable.');
    }

    // ⭐ CRITICAL FIX: Return an object containing both tokens
    return { appToken, refreshToken };

  } catch (error) {
    console.error('Error in verifyFirebaseToken:', error);
    throw error; // Re-throw the error to be caught by the calling component
  }
}