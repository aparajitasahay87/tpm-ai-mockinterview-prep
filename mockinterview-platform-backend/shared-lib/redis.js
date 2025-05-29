// shared-lib/redis.js
const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

/**
 * Creates and returns a Redis client
 * @param {Object} config - Redis configuration
 * @returns {Object} - Redis client
 */
const getRedisClient = (config) => {
  if (redisClient) return redisClient;
  
  const options = {
    host: config.host || 'localhost',
    port: config.port || 6379,
    password: config.password || undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  };
  
  redisClient = new Redis(options);
  
  redisClient.on('error', (err) => {
    logger.error(`Redis error: ${err}`);
  });
  
  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });
  
  return redisClient;
};

module.exports = { getRedisClient };
