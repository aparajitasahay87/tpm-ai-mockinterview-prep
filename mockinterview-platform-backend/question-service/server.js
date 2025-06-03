require('dotenv').config();
const express = require('express');
const questionRoutes = require('./routes/questionRoutes');
const authRoutes = require('./routes/authRoutes');
const { authenticate } = require('./middleware/authMiddleware');
const db = require('./config/database');
//const redisClient = require('./config/redis');

const cors = require('cors');
const app = express();
 
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true // Important if you're sending cookies or authorization headers
}));

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(authenticate);


app.use('/api/questions', questionRoutes);
//app.use('/api', questionRoutes); // Mount question routes directly under /api

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server Error'
  });
});

// Connect to PostgreSQL
db.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Failed to connect to PostgreSQL:', err));

// Connect to Redis
//redisClient.connect()
  //.then(() => console.log('Connected to Redis'))
  //.catch(err => console.error('Failed to connect to Redis:', err));


const actualPort = process.env.PORT || 3001;

app.listen(actualPort, () => {
  console.log(`Question Service running on port ${actualPort}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  try {
    await db.end();
    console.log('PostgreSQL connection closed.');
  } catch (err) {
    console.error('Error closing PostgreSQL connection:', err);
  }

  /*try {
    await redisClient.quit();
    console.log('Redis connection closed.');
  } catch (err) {
    console.error('Error closing Redis connection:', err);
  }
    */
  process.exit(0);
});

