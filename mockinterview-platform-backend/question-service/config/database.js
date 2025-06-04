require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Additional connection settings for better reliability
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, 
};

const pool = new Pool(poolConfig);

const connect = async () => {
  try {
    // Actually acquire a client and release immediately just to test connectivity
    const client = await pool.connect();
    client.release();
    console.log('Database connection successful using DATABASE_URL!');
  } catch (err) {
    console.error('Error connecting to database using DATABASE_URL:', err);
    throw err;
  }
};

const end = () => pool.end();

const query = async (text, params) => {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  connect,
  end,
  query, // Export the query function
};