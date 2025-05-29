// middleware/appAuthMiddleware.js (in your feedback service backend)

const jwt = require('jsonwebtoken');
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

if (!JWT_SECRET_KEY) {
    console.error('CRITICAL ERROR: JWT_SECRET_KEY is not set in environment variables for appAuthMiddleware!');
    // process.exit(1); // You might want to keep this for production
}

const verifyAppToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    console.log('Backend Middleware: Authorization Header:', authHeader); // Log the full header

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('Backend Middleware: Unauthorized: No Bearer token provided');
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Backend Middleware: Token received (first 20 chars):', token.substring(0, 20), '...'); // Log partial token for privacy
    console.log('Backend Middleware: JWT_SECRET_KEY used for verification (first 5 chars):', JWT_SECRET_KEY ? JWT_SECRET_KEY.substring(0, 5) : 'NOT SET'); // Log partial key

    try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY);
        console.log('Backend Middleware: Token successfully decoded:', decoded); // Log decoded payload
        req.user = decoded; // Attach user information to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Backend Middleware: Token verification failed. Error type:', error.name, 'Message:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired. Please re-login.' });
        }
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

module.exports = verifyAppToken;