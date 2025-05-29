const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env

const uri = process.env.MONGO_URI; // Your MongoDB connection URI

async function connectDB() {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB Connected:', mongoose.connection.host);
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('Mongoose reconnected');
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1); // Exit the process if database connection fails
  }
}

const getDatabase = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  return mongoose.connection.db;
};

const closeDB = async () => {
  if (mongoose.connection) {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
};

module.exports = { connectDB, getDatabase, closeDB, mongoose }; // Export mongoose