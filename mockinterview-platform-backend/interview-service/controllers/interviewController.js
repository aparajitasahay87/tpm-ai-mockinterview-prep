// interview-service/controllers/interviewController.js
const Interview = require('../models/interviewModel');
const axios = require('axios');

// Middleware to verify token (assuming you have this)
const { verifyToken } = require('../middleware/authMiddleware');
const INTERVIEW_CACHE_PREFIX = 'interview:';
const INTERVIEW_CACHE_TTL = 3600; // 1 hour

// @desc    Create a new interview
// @route   POST /api/interviews
// @access  Private
exports.createInterview = async (req, res) => {
  try {
    const { title, categories } = req.body;
    const user = req.user.id; // User ID from the auth middleware

    const interview = await Interview.create({
      user,
      title,
      categories,
    });

    res.status(201).json({ success: true, data: interview });
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ success: false, message: 'Failed to create interview', error: error.message });
  }
};

// @desc    Get all interviews for a user
// @route   GET /api/interviews
// @access  Private
const INTERVIEW_CACHE_TTL = 3600; // 1 hour

exports.getInterview = async (req, res) => {
  const interviewId = req.params.id;
  const cacheKey = `${INTERVIEW_CACHE_PREFIX}${interviewId}`;

  try {
    const cachedInterview = await redisClient.get(cacheKey);
    if (cachedInterview) {
      console.log(`Cache hit for interview ${interviewId}`);
      return res.status(200).json({ success: true, data: JSON.parse(cachedInterview) });
    }

    const interview = await Interview.findById(interviewId).where({ user: req.user.id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Store in Redis with expiration
    await redisClient.set(cacheKey, JSON.stringify(interview), { EX: INTERVIEW_CACHE_TTL });
    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    console.error('Error getting interview:', error);
    res.status(500).json({ success: false, message: 'Failed to get interview', error: error.message });
  }
};

// @desc    Get a single interview by ID
// @route   GET /api/interviews/:id
// @access  Private
exports.getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id).where({ user: req.user.id });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    console.error('Error getting interview:', error);
    res.status(500).json({ success: false, message: 'Failed to get interview', error: error.message });
  }
};

// @desc    Add a user's response to a question
// @route   POST /api/interviews/:interviewId/questions/:questionId/responses
// @access  Private
exports.addResponse = async (req, res) => {
  try {
    const { content, image } = req.body;
    const { interviewId, questionId } = req.params;
    const userId = req.user.id;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    const category = interview.categories.find(cat => cat.questions.id(questionId));
    const question = category ? category.questions.id(questionId) : null;

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found in this interview' });
    }

    const newResponse = { userId, content, image, timestamp: new Date() };
    question.responses.push(newResponse);
    await interview.save();

    // --- Call feedback-service ---
    try {
      const feedbackResponse = await axios.post(
        `${process.env.FEEDBACK_SERVICE_URL}/feedback`,
        { response: content, image: image },
        {
          headers: {
            Authorization: req.headers.authorization, // Forward user's token
          },
        }
      );

      const aiFeedback = feedbackResponse.data.feedback;
      // In a real scenario, you would likely store the aiFeedbackId in the response
      // and potentially the feedback content in a separate collection.
      console.log('AI Feedback received:', aiFeedback);

      res.status(200).json({ success: true, data: { response: newResponse, aiFeedback } });

    } catch (feedbackError) {
      console.error('Error communicating with feedback-service:', feedbackError.message);
      res.status(200).json({
        success: true,
        data: { response: newResponse, feedbackError: 'Failed to generate feedback' },
      });
    }

  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ success: false, message: 'Failed to add response', error: error.message });
  }
};

// @desc    Update an existing interview
// @route   PUT /api/interviews/:id
// @access  Private
exports.updateInterview = async (req, res) => {
  try {
    const interview = await Interview.findByIdAndUpdate(
      req.params.id,
      { user: req.user.id, ...req.body },
      { new: true, runValidators: true }
    );

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    res.status(200).json({ success: true, data: interview });
  } catch (error) {
    console.error('Error updating interview:', error);
    res.status(500).json({ success: false, message: 'Failed to update interview', error: error.message });
  }
};

// @desc    Delete an interview
// @route   DELETE /api/interviews/:id
// @access  Private
exports.deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findByIdAndDelete(req.params.id).where({ user: req.user.id });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ success: false, message: 'Failed to delete interview', error: error.message });
  }
};