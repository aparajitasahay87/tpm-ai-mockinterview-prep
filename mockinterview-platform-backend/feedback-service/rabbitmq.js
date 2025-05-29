// rabbitmq.js
const amqp = require('amqplib');
require('dotenv').config({ path: '../shared-lib/.env' });

// Extract configuration from environment variables 
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const RECONNECT_TIMEOUT = 5000;

let connection = null;
let channel = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Connect to RabbitMQ server
 * @returns {Promise<amqp.Connection>} - RabbitMQ connection
 */
async function connect() {
  if (connection) {
    return connection;
  }

  if (isConnecting) {
    // Wait for the existing connection attempt to finish
    console.log('RabbitMQ connection attempt in progress, waiting...');
    await waitForConnection();
    return connection;
  }

  isConnecting = true;
  connectionAttempts = 0;

  try {
    console.log(`Connecting to RabbitMQ at ${RABBITMQ_URL.replace(/:([^:@]+)@/, ':****@')}`);
    connection = await amqp.connect(RABBITMQ_URL);
    
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
      cleanupConnection();
    });
    
    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      cleanupConnection();
      
      // Automatic reconnection after delay
      setTimeout(async () => {
        try {
          await connect();
          console.log('RabbitMQ reconnected');
        } catch (err) {
          console.error('RabbitMQ reconnection failed:', err);
        }
      }, RECONNECT_TIMEOUT);
    });
    
    console.log('Connected to RabbitMQ');
    isConnecting = false;
    connectionAttempts = 0;
    return connection;
    
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    isConnecting = false;
    
    if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      connectionAttempts++;
      console.log(`Retrying connection (${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${RECONNECT_TIMEOUT/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RECONNECT_TIMEOUT));
      return connect(); // Recursive retry
    } else {
      console.error(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
      throw error;
    }
  }
}

/**
 * Wait for an ongoing connection attempt to complete
 * @returns {Promise<void>}
 */
async function waitForConnection(timeout = 30000) {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkConnection = () => {
      if (connection) {
        return resolve();
      }
      
      if (!isConnecting) {
        return reject(new Error('Connection attempt failed'));
      }
      
      if (Date.now() - startTime > timeout) {
        return reject(new Error('Connection wait timeout'));
      }
      
      setTimeout(checkConnection, 500);
    };
    
    checkConnection();
  });
}

/**
 * Clean up the connection and channel references
 */
function cleanupConnection() {
  connection = null;
  channel = null;
}

/**
 * Get a channel from the RabbitMQ connection
 * @returns {Promise<amqp.Channel>} - RabbitMQ channel
 */
async function getChannel() {
  if (channel) {
    return channel;
  }
  
  const conn = await connect();
  channel = await conn.createChannel();
  
  channel.on('error', (err) => {
    console.error('RabbitMQ channel error:', err);
    channel = null;
  });
  
  channel.on('close', () => {
    console.log('RabbitMQ channel closed');
    channel = null;
  });
  
  return channel;
}

/**
 * Close the RabbitMQ connection
 * @returns {Promise<void>}
 */
async function closeConnection() {
  try {
    if (channel) {
      console.log('Closing RabbitMQ channel...');
      await channel.close();
      channel = null;
    }
    
    if (connection) {
      console.log('Closing RabbitMQ connection...');
      await connection.close();
      connection = null;
    }
    
    console.log('RabbitMQ connection closed gracefully');
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
    // Force cleanup
    cleanupConnection();
    throw error;
  }
}

module.exports = {
  connect,
  getChannel,
  closeConnection
};