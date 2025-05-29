const mongoose = require('mongoose');

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
  family: 4 // Use IPv4, skip trying IPv6
};

async function connectDB() {
  if (isConnecting) {
    console.log('Connection attempt already in progress, waiting...');
    return waitForConnection();
  }

  isConnecting = true;
  connectionAttempts++;

  try {
    console.log(`Connecting to MongoDB (attempt ${connectionAttempts})...`);
    await mongoose.connect(uri, connectionOptions);
    console.log('MongoDB Connected:', mongoose.connection.host);
    isConnecting = false;
    connectionAttempts = 0; // Reset only on successful connection
    setupConnectionEventHandlers();
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    isConnecting = false;

    if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      console.log(`Retrying connection in ${RECONNECT_INTERVAL / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RECONNECT_INTERVAL));
      return connectDB();
    } else {
      console.error(`Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
      process.exit(1);
    }
  }
}

// Wait for an ongoing connection attempt to complete
async function waitForConnection(timeout = 30000) {
  console.log('Waiting for existing connection attempt to complete...');
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkConnection = () => {
      if (mongoose.connection.readyState === 1) {
        console.log('Existing connection attempt succeeded');
        return resolve(mongoose.connection);
      }

      if (!isConnecting && mongoose.connection.readyState !== 2) {
        console.log('Existing connection attempt failed');
        return reject(new Error('Connection attempt failed'));
      }

      if (Date.now() - startTime > timeout) {
        console.log('Timed out waiting for connection');
        return reject(new Error('Connection wait timeout'));
      }

      setTimeout(checkConnection, 500);
    };

    checkConnection();
  });
}

// Setup connection event handlers
function setupConnectionEventHandlers() {
  mongoose.connection.removeAllListeners('disconnected');
  mongoose.connection.removeAllListeners('reconnected');
  mongoose.connection.removeAllListeners('error');

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
    if (!isConnecting && mongoose.connection.readyState === 0) {
      console.log('Attempting automatic reconnection...');
      connectDB().catch(err => {
        console.error('Auto-reconnection failed:', err);
      });
    }
  });

  mongoose.connection.on('reconnected', () => {
    console.log('Mongoose reconnected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
    if (err.name === 'MongoNetworkError' || 
        err.name === 'MongoServerSelectionError' ||
        err.message.includes('topology was destroyed')) {
      console.log('Fatal connection error detected, attempting to reconnect...');
      if (!isConnecting) {
        connectDB().catch(err => {
          console.error('Reconnection failed:', err);
        });
      }
    }
  });
}

const getDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Call connectDB first.');
  }

  return mongoose.connection.db;
};

const ensureConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  return connectDB();
};

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
  ensureConnection 
};
