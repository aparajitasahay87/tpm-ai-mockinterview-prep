// feedback-service/src/config/redis.js

const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL, // Ensure REDIS_URL env var is set on Render
});

redisClient.on('error', (err) => console.error('Redis Client Error', err)); // Using console.error instead of logger
redisClient.on('connect', () => console.log('Redis Client Connected')); // Using console.log instead of logger
redisClient.on('ready', () => console.log('Redis Client Ready')); // Using console.log instead of logger
redisClient.on('end', () => console.log('Redis Client Disconnected')); // Using console.log instead of logger

// Connect the client when the application starts
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err); // Using console.error instead of logger
  }
})();

module.exports = redisClient;
