// shared-lib/messageBroker.js
const amqp = require('amqplib');
const logger = require('./logger');

let connection = null;
let channel = null;

/**
 * Connects to RabbitMQ and creates a channel
 * @param {string} url - RabbitMQ connection URL
 * @returns {Object} - Object containing connection and channel
 */
const connect = async (url) => {
  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    
    // Handle connection closure
    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
    });
    
    logger.info('Connected to RabbitMQ');
    return { connection, channel };
  } catch (error) {
    logger.error(`Error connecting to RabbitMQ: ${error.message}`);
    throw error;
  }
};

/**
 * Creates a queue if it doesn't exist
 * @param {string} queueName - Name of the queue
 * @param {Object} options - Queue options
 */
const assertQueue = async (queueName, options = {}) => {
  if (!channel) throw new Error('Channel not established');
  await channel.assertQueue(queueName, {
    durable: true,
    ...options
  });
  logger.info(`Queue ${queueName} asserted`);
};

/**
 * Sends a message to a queue
 * @param {string} queueName - Name of the queue
 * @param {Object} message - Message to send
 */
const sendToQueue = (queueName, message) => {
  if (!channel) throw new Error('Channel not established');
  channel.sendToQueue(
    queueName,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
  logger.debug(`Message sent to queue ${queueName}`);
};

/**
 * Consumes messages from a queue
 * @param {string} queueName - Name of the queue
 * @param {Function} callback - Function to process messages
 */
const consume = async (queueName, callback) => {
  if (!channel) throw new Error('Channel not established');
  await channel.consume(queueName, async (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        await callback(content);
        channel.ack(msg);
      } catch (error) {
        logger.error(`Error processing message: ${error.message}`);
        // Nack with requeue if appropriate
        channel.nack(msg, false, true);
      }
    }
  });
  logger.info(`Consumer set up for queue ${queueName}`);
};

/**
 * Closes the RabbitMQ connection
 */
const close = async () => {
  if (channel) await channel.close();
  if (connection) await connection.close();
  logger.info('RabbitMQ connection closed');
};

module.exports = {
  connect,
  assertQueue,
  sendToQueue,
  consume,
  close
};