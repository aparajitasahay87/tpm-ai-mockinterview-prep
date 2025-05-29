// interview-service/server.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('your-shared-lib-package-name/database'); // Adjust the path based on your shared-lib structure
const interviewRoutes = require('./routes/interviewRoutes');
const { verifyToken } = require('./middleware/authMiddleware');
// interview-service/server.js (or a separate cache utility file)
const redis = require('redis');

// Configure Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379' // Use environment variable for URL
});

// Handle connection events
redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Connect to Redis (async)
async function connectRedis() {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
}

connectRedis();

// Export the client instance so you can use it in your controllers
module.exports = redisClient;

// Load environment variables
dotenv.config();

// Connect to MongoDB using the shared function
connectDB(process.env.MONGO_URI); // Pass the MONGO_URI from your .env

const app = express();

// Body parser middleware
app.use(express.json());

// Apply authentication middleware to all routes under /api
app.use('/api', verifyToken, interviewRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Interview service is healthy' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});