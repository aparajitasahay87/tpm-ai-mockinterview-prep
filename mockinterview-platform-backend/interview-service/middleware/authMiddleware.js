// interview-service/middleware/authMiddleware.js
const axios = require('axios');

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
      const authResponse = await axios.get(
        `${process.env.AUTH_SERVICE_URL}/api/auth/verify-token`, // Endpoint in your auth-service to verify tokens
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (authResponse.data.isValid) {
        req.user = authResponse.data.user; // Attach user information to the request object
        next(); // Proceed to the next middleware or route handler
      } else {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
      }
    } catch (authError) {
      console.error('Error verifying token with auth-service:', authError.message);
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  } catch (error) {
    console.error('Error in verifyToken middleware:', error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};