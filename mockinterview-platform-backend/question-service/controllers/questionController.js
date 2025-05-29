const { query } = require('../config/database'); // Import the query function
//const redisClient = require('../config/redis');
const { promisify } = require('util');
//const getAsync = promisify(redisClient.get).bind(redisClient);
//const setAsync = promisify(redisClient.set).bind(redisClient);

//const CATEGORIES_CACHE_KEY = 'categories:all';
//const QUESTIONS_CACHE_PREFIX = 'questions:category:';
//const CACHE_EXPIRATION_SECONDS = 3600; // 1 hour

exports.getCategories = async (req, res) => {
  try {
    // Check Redis cache
    console.log("I got till here");
    /*const cachedCategories = await redisClient.get(CATEGORIES_CACHE_KEY);
    if (cachedCategories) {
      return res.json(JSON.parse(cachedCategories));
    }
      */

    // Fetch from database if not cached
    const { rows } = await query('SELECT category_id, name, description, has_diagram FROM categories');

    // Cache the result in Redis with expiration
    //await redisClient.setEx(CATEGORIES_CACHE_KEY, CACHE_EXPIRATION_SECONDS, JSON.stringify(rows));

    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

exports.getQuestionsByCategory = async (req, res) => {
    console.log("getQuestionsByCategory called");
    const { categoryId } = req.params;
    console.log("categoryId:", categoryId);

    if (!categoryId) {
        return res.status(400).json({ error: 'categoryId is required' });
    }

    try {
        console.log("Trying to fetch questions directly from the database...");
        //const queryText = 'SELECT question_id, title, content, difficulty_level FROM questions WHERE category_id = $1';
         const queryText = `
            SELECT
                q.question_id,
                q.title,
                q.content,
                q.difficulty_level,
                c.has_diagram, -- <<-- ADD THIS LINE to select has_diagram
                c.name AS category_name -- Optional: get category name as well
            FROM questions q
            JOIN categories c ON q.category_id = c.category_id -- <<-- ADD THIS JOIN
            WHERE q.category_id = $1;
        `;
        console.log("Executing database query:", queryText, [categoryId]);
        const { rows } = await query(queryText, [categoryId]);
        console.log("Database rows:", rows);

        console.log("Sending response:", rows);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching questions from database:", error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
};

// controllers/questionController.js (Add this function)
exports.getQuestionById = async (req, res) => {
    const { questionId } = req.params;
    console.log("getQuestionById called for questionId:", questionId);

    if (!questionId) {
        return res.status(400).json({ error: 'Question ID is required' });
    }

    try {
        const queryText = `
            SELECT
                q.question_id,
                q.title,
                q.content,
                q.difficulty_level,
                c.has_diagram, -- Select has_diagram from categories
                c.name AS category_name -- Optional: get category name
            FROM questions q
            JOIN categories c ON q.category_id = c.category_id
            WHERE q.question_id = $1;
        `;
        const { rows } = await query(queryText, [questionId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }

        res.json(rows[0]); // Return the single question object
    } catch (error) {
        console.error(`Error fetching question ${questionId}:`, error);
        res.status(500).json({ error: 'Failed to fetch question' });
    }
};
    /*
    try {
    // Check Redis cache
    const cachedQuestions = await getAsync(cacheKey);
    if (cachedQuestions) {
      return res.json(JSON.parse(cachedQuestions));
    }
    // Fetch from database if not cached
    const { rows } = await query('SELECT question_id, title, content, difficulty_level FROM questions WHERE category_id = $1', [categoryId]);

    // Cache the result in Redis
    await setAsync(cacheKey, JSON.stringify(rows), 'EX', CACHE_EXPIRATION_SECONDS);

    res.json(rows);
  } catch (error) {
    console.error(`Error fetching questions for category ${categoryId}:`, error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};
*/
