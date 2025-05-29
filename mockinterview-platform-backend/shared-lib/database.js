const mongoose = require('mongoose');
//const dotenv = require('dotenv');
//dotenv.config(); // Load environment variables from .env

const uri = process.env.MONGO_URI; // Your MongoDB connection URI
let isConnecting = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000; // 5 seconds

// Configure mongoose
mongoose.set('strictQuery', false);

// MongoDB connection options for better stability
const connectionOptions = {
  serverSelectionTimeoutMS: 50000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
  // Add these options:
  connectTimeoutMS: 30000,
  maxPoolSize: 10, // Adjust based on your needs
  minPoolSize: 1, // Keep at least one connection in the pool
  maxIdleTimeMS: 30000 // Close idle connections after 30 seconds
};

async function connectDB() {
  // If already connecting, don't start another connection process
  if (isConnecting) {
    console.log('Connection attempt already in progress, waiting...');
    return waitForConnection();
  }

  // Reset connection state
  isConnecting = true;
  connectionAttempts = 0;
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, connectionOptions);
    console.log('MongoDB Connected:', mongoose.connection.host);
    isConnecting = false;
    connectionAttempts = 0;
    setupConnectionEventHandlers();
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    isConnecting = false;
    
    if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      connectionAttempts++;
      console.log(`Retrying connection (${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${RECONNECT_INTERVAL/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RECONNECT_INTERVAL));
      return connectDB(); // Recursive retry
    } else {
      console.error(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
      process.exit(1); // Exit the process if all connection attempts fail
    }
  }
}

// Wait for an ongoing connection attempt to complete
async function waitForConnection(timeout = 30000) {
  console.log('Waiting for existing connection attempt to complete...');
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkConnection = () => {
      // Connection succeeded
      if (mongoose.connection.readyState === 1) {
        console.log('Existing connection attempt succeeded');
        return resolve(mongoose.connection);
      }
      
      // Connection failed
      if (!isConnecting && mongoose.connection.readyState !== 2) {
        console.log('Existing connection attempt failed');
        return reject(new Error('Connection attempt failed'));
      }
      
      // Timeout
      if (Date.now() - startTime > timeout) {
        console.log('Timed out waiting for connection');
        return reject(new Error('Connection wait timeout'));
      }
      
      // Keep waiting
      setTimeout(checkConnection, 500);
    };
    
    checkConnection();
  });
}

// Setup connection event handlers
function setupConnectionEventHandlers() {
  // Remove any existing listeners to prevent duplicates
  mongoose.connection.removeAllListeners('disconnected');
  mongoose.connection.removeAllListeners('reconnected');
  mongoose.connection.removeAllListeners('error');
  
  // Handle disconnection
  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
    // Auto reconnect if not already connecting
    if (!isConnecting && mongoose.connection.readyState === 0) {
      console.log('Attempting automatic reconnection...');
      connectDB().catch(err => {
        console.error('Auto-reconnection failed:', err);
      });
    }
  });
  
  // Handle reconnection
  mongoose.connection.on('reconnected', () => {
    console.log('Mongoose reconnected to MongoDB');
  });
  
  // Handle errors (separate from connection errors)
  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
    
    // If the error is fatal, try to reconnect
    if (err.name === 'MongoNetworkError' || 
        err.name === 'MongoServerSelectionError' ||
        err.message.includes('topology was destroyed')) {
      
      console.log('Fatal connection error detected, attempting to reconnect...');
      // Only reconnect if not already connecting
      if (!isConnecting) {
        connectDB().catch(err => {
          console.error('Reconnection failed:', err);
        });
      }
    }
  });
}

// Get the database instance (with connection check)
const getDatabase = async () => {
  // If not connected, try to connect
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  
  // Double-check connection state
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  
  return mongoose.connection.db;
};

// Ensure database connection
const ensureConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection; // Already connected
  }
  
  return connectDB(); // Connect or wait for ongoing connection
};

// Close database connection
const closeDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
};

module.exports = { 
  connectDB, 
  getDatabase, 
  closeDB, 
  mongoose,
  ensureConnection // New helper function
};