export async function verifyFirebaseToken(firebaseToken) {
  const response = await fetch('http://localhost:4001/auth/verify-firebase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firebaseIdToken: firebaseToken }),
  });
  if (!response.ok) {
  // handle error
   console.error('Initial Firebase token exchange failed. Status:', response.status);
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        // Throw an error to be caught by the calling component (e.g., login page)
        throw new Error(errorData.message || 'Failed to verify Firebase token with backend.');
}


const data = await response.json();  // <-- This reads the response body
console.log('Response data:', data); // See what's inside

const { appToken , refreshToken } = data;           // Extract token key as backend sends 'appToken'

 if (appToken) {
    // Store your custom appToken under the 'appToken' key
    localStorage.setItem('appToken', appToken);
    console.log('Custom AppToken saved to localStorage:', appToken);
  } else {
    console.error('Custom AppToken not found in YOUR backend response:', data);
    throw new Error('Authentication failed: No custom appToken received from backend.');
  }
if (refreshToken) {
    // Store your refresh token
    localStorage.setItem('refreshToken', refreshToken);
    // Log the refresh token, not the appToken again
    console.log('Refresh Token saved to localStorage:', refreshToken);
  } else {
    console.warn('No RefreshToken received from backend. Session might not be refreshable.');
  }
  return appToken;

}
