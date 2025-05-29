require('dotenv').config();
const { Client } = require('pg');

// Database connection configuration using DATABASE_URL
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
};

async function testDatabaseConnection() {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('Successfully connected to the database using DATABASE_URL!');

    const res = await client.query('SELECT NOW()');
    console.log('Current database time:', res.rows[0].now);

    console.log('Database test successful!');

  } catch (err) {
    console.error('Error connecting to the database:', err);
    console.error('Database test failed.');
  } finally {
    await client.end();
  }
}

testDatabaseConnection();