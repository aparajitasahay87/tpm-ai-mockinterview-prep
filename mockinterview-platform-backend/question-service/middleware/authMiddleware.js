// question-service/middleware/authMiddleware.js

/*console.log('Auth middleware triggered'); // Add this at the top
const jwt = require('jsonwebtoken');
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY; // Make sure this is set in your environment

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Received token:', token); // Add this line

  if (!JWT_SECRET_KEY) {
    console.error('JWT_SECRET_KEY is not set in the environment.');
    return res.status(500).json({ message: 'Internal Server Error: JWT key not configured' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    console.log('Decoded JWT payload:', decoded); // Optional: For debugging
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = { authenticate };
*/
const jwt = require('jsonwebtoken');
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

/**
 * Authentication middleware that verifies JWT tokens
 */
const authenticate = (req, res, next) => {
  console.log('Auth middleware triggered');
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists and is properly formatted
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: 'Unauthorized: No token provided',
      error: 'missing_token'
    });
  }

  const token = authHeader.split(' ')[1];
  console.log('Received token:', token);

  // Verify environment is properly configured
  if (!JWT_SECRET_KEY) {
    console.error('JWT_SECRET_KEY is not set in the environment.');
    return res.status(500).json({ 
      message: 'Internal Server Error: JWT key not configured',
      error: 'server_config_error'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    console.log('Decoded JWT payload:', decoded);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    
    // Provide specific error responses based on the type of error
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        error: 'token_expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        error: 'invalid_token'
      });
    } else {
      return res.status(401).json({ 
        message: 'Token verification failed',
        error: 'token_verification_failed'
      });
    }
  }
};

/**
 * Middleware for handling token refresh
 */
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ 
      message: 'Refresh token is required',
      error: 'missing_refresh_token'
    });
  }

  if (!JWT_REFRESH_SECRET) {
    console.error('JWT_REFRESH_SECRET is not set in the environment.');
    return res.status(500).json({ 
      message: 'Internal Server Error: JWT refresh key not configured',
      error: 'server_config_error'
    });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Generate a new access token
    const newToken = jwt.sign(
      { uid: decoded.uid }, // Maintain the same user ID
      JWT_SECRET_KEY,
      { expiresIn: '1h' } // Set appropriate expiration
    );
    
    return res.status(200).json({
      token: newToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    
    // Provide specific error responses
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Refresh token expired, please login again',
        error: 'refresh_token_expired'
      });
    } else {
      return res.status(401).json({ 
        message: 'Invalid refresh token',
        error: 'invalid_refresh_token'
      });
    }
  }
};

module.exports = { authenticate, refreshToken };