// Run this code separately, or integrate into a setup script.

require('dotenv').config();
const { Client } = require('pg');

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
};

async function insertInitialData() {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database!');

    // Insert into categories
    await client.query(`
      INSERT INTO categories (name, description, has_diagram)
      VALUES
        ('System Design', 'Questions about designing scalable systems', TRUE),
        ('Behavioral', 'Questions about past behavior and experiences', FALSE),
        ('Product Sense', 'Questions about product strategy and user understanding', FALSE)
      ON CONFLICT (name) DO NOTHING; --  Handles duplicate category names
    `);
    console.log('Inserted data into "categories" table.');

    // Insert into questions
    await client.query(`
      INSERT INTO questions (category_id, title, content, difficulty_level)
      VALUES
        (
          (SELECT category_id FROM categories WHERE name = 'System Design'),
          'Design a URL Shortener',
          'Design a system that shortens long URLs.  Consider scalability, reliability, and consistency.',
          'Hard'
        ),
        (
          (SELECT category_id FROM categories WHERE name = 'System Design'),
          'Design a Chat Application',
          'Design a real-time chat application.  Consider scalability and message delivery.',
          'Hard'
        ),
        (
          (SELECT category_id FROM categories WHERE name = 'Behavioral'),
          'Tell me about a time you failed.',
          'Describe a situation where you failed.  How did you handle it?  What did you learn?',
          'Easy'
        ),
        (
          (SELECT category_id FROM categories WHERE name = 'Behavioral'),
          'Tell me about a time you worked on a team.',
          'Describe your experience working as part of a team.  What was your role?  How did you contribute?',
          'Medium'
        ),
        (
          (SELECT category_id FROM categories WHERE name = 'Product Sense'),
          'Design a better alarm clock.',
          'How would you improve the design of a standard alarm clock?  Consider user needs and innovative features.',
          'Medium'
        ),
        (
          (SELECT category_id FROM categories WHERE name = 'Product Sense'),
          'What is your favorite product and why?',
          'Describe a product you enjoy using and explain the reasons for your preference.',
          'Easy'
        )
      ON CONFLICT (title) DO NOTHING; --  Handles duplicate question titles
    `);
    console.log('Inserted data into "questions" table.');

    console.log('Initial data inserted successfully!');
  } catch (error) {
    console.error('Error inserting initial data:', error);
  } finally {
    await client.end();
  }
}

insertInitialData();
