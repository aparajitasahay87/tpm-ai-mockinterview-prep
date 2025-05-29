// server.js (for your backend feedback microservice)

require('dotenv').config(); // Load environment variables

const express = require('express');
const cors = require('cors');
const feedbackRoutes = require('./routes/feedbackRoutes');
//const logger = require('./shared-lib/logger'); // Adjust path as needed

const app = express();

// ... (CORS and express.json() middleware) ...
// CORS Middleware - MUST BE PLACED BEFORE YOUR ROUTES
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Crucial for sending JWTs
}));

// ⭐ CRITICAL FIX: Add middleware to parse JSON request bodies
app.use(express.json()); // <--- ADD THIS LINE!

app.use('/api', feedbackRoutes);

// ... (Error handling and server start) ...

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    //logger.info(`Feedback microservice listening on port ${PORT}`);
    console.log(`Feedback microservice listening on port ${PORT}`);
    // IMPORTANT: Verify JWT_SECRET_KEY is loaded!
    if (!process.env.JWT_SECRET_KEY) {
        //logger.error('CRITICAL ERROR: JWT_SECRET_KEY environment variable is NOT set!');
        console.error('CRITICAL ERROR: JWT_SECRET_KEY environment variable is NOT set!');
        process.exit(1); // Exit if secret key is missing
    }
});