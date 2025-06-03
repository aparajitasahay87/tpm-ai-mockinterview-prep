// server.js (for your backend feedback microservice)

require('dotenv').config(); // Load environment variables

const express = require('express');
const cors = require('cors');
const feedbackRoutes = require('./routes/feedbackRoutes');
//const logger = require('./shared-lib/logger'); // Adjust path as needed

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true // Important if you're sending cookies or authorization headers
}));

// ⭐ CRITICAL FIX: Add middleware to parse JSON request bodies
app.use(express.json()); // <--- ADD THIS LINE!

app.use('/api', feedbackRoutes);

// ... (Error handling and server start) ...

//const PORT = process.env.PORT || 5000;
const actualPort = process.env.PORT || 5000;
app.listen(actualPort, () => {
    //logger.info(`Feedback microservice listening on port ${PORT}`);
    console.log(`Feedback microservice listening on port ${actualPort}`);
    // IMPORTANT: Verify JWT_SECRET_KEY is loaded!
    if (!process.env.JWT_SECRET_KEY) {
        //logger.error('CRITICAL ERROR: JWT_SECRET_KEY environment variable is NOT set!');
        console.error('CRITICAL ERROR: JWT_SECRET_KEY environment variable is NOT set!');
        process.exit(1); // Exit if secret key is missing
    }
});