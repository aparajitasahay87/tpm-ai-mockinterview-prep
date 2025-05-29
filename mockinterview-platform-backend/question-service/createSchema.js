require('dotenv').config();
const { Client } = require('pg');

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
};

async function createSchemaAndTables() {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database!');

    // Create Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);
    console.log('Table "Users" created successfully.');

    // Create Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Categories (
        category_id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        has_diagram BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('Table "Categories" created successfully.');

    // Create Questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Questions (
        question_id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES Categories(category_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        difficulty_level VARCHAR(10) CHECK (difficulty_level IN ('Easy', 'Medium', 'Hard')) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);
    console.log('Table "Questions" created successfully.');

    // Create User_Responses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS User_Responses (
        response_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
        question_id INTEGER NOT NULL REFERENCES Questions(question_id) ON DELETE CASCADE,
        text_response TEXT,
        diagram_data JSONB, -- Using JSONB for efficient JSON storage
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        duration_seconds INTEGER
      );
    `);
    console.log('Table "User_Responses" created successfully.');

    // Create AI_Feedback table
    await client.query(`
      CREATE TABLE IF NOT EXISTS AI_Feedback (
        feedback_id SERIAL PRIMARY KEY,
        response_id INTEGER UNIQUE NOT NULL REFERENCES User_Responses(response_id) ON DELETE CASCADE,
        feedback_content TEXT,
        strength_points TEXT[], -- Using an array to store multiple points
        improvement_areas TEXT[], -- Using an array to store multiple areas
        score INTEGER CHECK (score BETWEEN 1 AND 10),
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "AI_Feedback" created successfully.');

    // Create Practice_Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS Practice_Sessions (
        session_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP WITH TIME ZONE,
        category_id INTEGER NOT NULL REFERENCES Categories(category_id) ON DELETE CASCADE,
        completed_questions INTEGER[] -- Array to store IDs of completed questions
      );
    `);
    console.log('Table "Practice_Sessions" created successfully.');

    console.log('Schema and core tables created successfully!');

  } catch (error) {
    console.error('Error creating schema and tables:', error);
  } finally {
    await client.end();
  }
}

createSchemaAndTables();