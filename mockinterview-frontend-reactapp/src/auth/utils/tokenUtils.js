import { jwtDecode } from 'jwt-decode';

export function isTokenExpiringSoon(token, thresholdSeconds = 300) {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime + thresholdSeconds;
  } catch (error) {
    console.error("Token decode error:", error);
    return true; // Assume expired
  }
}
