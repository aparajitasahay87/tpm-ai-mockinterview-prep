// question-service/src/routes/questionRoutes.js
const express = require('express');
const questionController = require('../controllers/questionController');
const { authenticate } = require('../middleware/authMiddleware'); 
const router = express.Router();

// Public endpoints (no specific authorization needed here, might be handled by API gateway)
router.get('/categories' , authenticate, questionController.getCategories);
router.get('/categories/:categoryId/questions', authenticate , questionController.getQuestionsByCategory);
// routes/questionRoutes.js (Add this route)
router.get('/:questionId', authenticate, questionController.getQuestionById);

// Example of an endpoint requiring specific authorization (using middleware)
// router.post('/categories', authMiddleware.authorizeAdmin, questionController.createCategory);

module.exports = router;