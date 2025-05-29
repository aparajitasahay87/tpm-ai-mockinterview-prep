// feedback-service/feedbackWorker.js

// ---------- ENVIRONMENT SETUP ----------
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Add this at the beginning of your worker file
console.log('==== Environment Check ====');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
if (process.env.MONGO_URI) {
  const sanitizedUri = process.env.MONGO_URI.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://[username]:[password]@');
  console.log('MONGO_URI format:', sanitizedUri);
}
console.log('RABBITMQ_URL exists:', !!process.env.RABBITMQ_URL);
console.log('==== End Environment Check ====');

// Load env from both .env files
const localEnvPath = path.resolve(__dirname, './.env');
const sharedEnvPath = path.resolve(__dirname, '../shared-lib/.env');

dotenv.config({ path: localEnvPath });
dotenv.config({ path: sharedEnvPath, override: true });

console.log('===== Worker Environment Variables =====');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
if (process.env.MONGO_URI) {
  const sanitizedUri = process.env.MONGO_URI.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://[username]:[password]@');
  console.log('MONGO_URI format:', sanitizedUri);
}
console.log('RABBITMQ_URL exists:', !!process.env.RABBITMQ_URL);
console.log('========================================');

// ---------- MODULE IMPORTS ----------
const { mongoose } = require('../shared-lib/database');
const { getChannel, closeConnection: closeRabbitMQ } = require('./rabbitmq');

// ✅ FIXED: Declare model at the top, but DO NOT import yet
let UserFeedback;

const FEEDBACK_QUEUE = 'feedback_queue';
const MAX_ATTEMPTS = 3;
const DB_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000;

// ---------- UTILS ----------
// Add this helper near the top of your file
async function waitForConnection(timeout = 15000) {
  const start = Date.now();
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - start > timeout) {
      throw new Error('MongoDB did not become ready within expected time.');
    }
    console.log(`Waiting for MongoDB to be ready (current state: ${mongoose.connection.readyState})...`);
    await new Promise((res) => setTimeout(res, 500));
  }
}
async function forceReconnectDB() {
  console.log('Force reconnecting to MongoDB...');
  try {
    if (mongoose.connection.readyState !== 0) {
      console.log('Closing existing connection...');
      await mongoose.connection.close();
    }

    mongoose.models = {};
    mongoose.modelSchemas = {};

    console.log('Establishing new connection...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 5,
      minPoolSize: 1,
    });

    console.log('New MongoDB connection established:', mongoose.connection.host);

    // Reload model if necessary
    try {
      mongoose.deleteModel('UserFeedback');
    } catch (error) {
      // Model might not exist yet, that's okay
    }
    require('./models/userFeedback');
    
    return true;
  } catch (error) {
    console.error('Force reconnection failed:', error.message);
    return false;
  }
}

async function executeWithRetry(operation, retries = DB_RETRY_ATTEMPTS) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (mongoose.connection.readyState !== 1) {
        console.log(`MongoDB not ready (state: ${mongoose.connection.readyState}), reconnecting...`);
        await forceReconnectDB();
      }

      return await operation();
    } catch (error) {
      const isMongoError = error.name === 'MongooseError' ||
        error.name === 'MongoNetworkError' ||
        error.message.includes('buffering timed out') ||
        error.message.includes('topology was destroyed');

      if (!isMongoError || attempt === retries) {
        console.error(`❌ Operation failed after ${attempt} attempt(s):`, error.message);
        throw error;
      }

      console.warn(`⚠️ Attempt ${attempt} failed: ${error.message}. Retrying in ${RETRY_DELAY}ms...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      await forceReconnectDB();
    }
  }
}

// Define heartbeatInterval in the outer scope
let heartbeatInterval;

async function processFeedback() {
  try {
    console.log('Starting database connection...');
    await forceReconnectDB();

    // ✅ FIXED: Import model AFTER MongoDB is connected
    UserFeedback = require('./models/userFeedback');

    console.log('Database connection state:', mongoose.connection.readyState);
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`Database connection not ready. Current state: ${mongoose.connection.readyState}`);
    }
    console.log('Database connected successfully!');

    heartbeatInterval = setInterval(async () => {
      try {
        const pingResult = await mongoose.connection.db.admin().ping();
        console.log('Database heartbeat ping:', pingResult ? 'OK' : 'Failed');

        try {
          const count = await mongoose.connection.db.collection('user_feedback')
            .countDocuments({}, { maxTimeMS: 3000 });
          console.log('Database operation test: Success (count:', count, ')');
        } catch (opError) {
          console.error('Database operation test failed:', opError.message);
          console.log('Connection appears stale, force reconnecting...');
          await forceReconnectDB();
        }
      } catch (error) {
        console.error('Database heartbeat failed:', error.message);
        console.log('Heartbeat failed, force reconnecting...');
        await forceReconnectDB();
      }
    }, 15000);

    const channel = await getChannel();
    await channel.assertQueue(FEEDBACK_QUEUE, { durable: true });

    console.log('Worker is waiting for feedback messages...');

    channel.consume(
      FEEDBACK_QUEUE,
      async (msg) => {
        if (!msg) return;

        const message = JSON.parse(msg.content.toString());
        console.log('Worker received feedback message:', message);

        try {
          const { userId, response, feedback, timestamp } = message;

          const existingAttempts = await executeWithRetry(async () => {
            console.log('Worker querying existing attempts for userId:', userId);
            return await UserFeedback.find({ userId }).sort({ timestamp: -1 }).limit(MAX_ATTEMPTS);
          });

          console.log('Worker found existing attempts:', existingAttempts.length);

          const newFeedbackEntry = new UserFeedback({
            userId,
            response,
            feedback,
            timestamp: new Date(timestamp),
          });

          await executeWithRetry(async () => {
            console.log('Worker saving new feedback entry');
            return await newFeedbackEntry.save();
          });

          console.log('Worker saved feedback to database:', newFeedbackEntry._id);

          if (existingAttempts.length >= MAX_ATTEMPTS) {
            const oldestAttempt = existingAttempts[MAX_ATTEMPTS - 1];
            await executeWithRetry(async () => {
              console.log('Worker deleting oldest attempt:', oldestAttempt._id);
              return await UserFeedback.findByIdAndDelete(oldestAttempt._id);
            });
            console.log('Worker deleted oldest attempt successfully');
          }

          channel.ack(msg);
        } catch (error) {
          console.error('Worker error processing feedback:', error);
          channel.nack(msg, false, true);
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error('Critical error in worker setup:', error);
    process.exit(1);
  }
}

// ---------- CLEAN SHUTDOWN ----------
process.on('SIGINT', async () => {
  console.log('Worker received SIGINT, closing connections...');
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  await closeRabbitMQ();
  await mongoose.connection.close();
  console.log('Worker shut down complete');
  process.exit(0);
});

processFeedback();
