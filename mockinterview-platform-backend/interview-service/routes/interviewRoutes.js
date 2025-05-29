// interview-service/routes/interviewRoutes.js
const express = require('express');
const { protect } = require('../../auth-service/middleware/authMiddleware');
const {
  createInterview,
  getInterviews,
  getInterview,
  updateInterview,
  addResponse,
  deleteInterview
} = require('../controllers/interviewController');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getInterviews)
  .post(createInterview);

router.route('/:id')
  .get(getInterview)
  .put(updateInterview)
  .delete(deleteInterview);

router.post('/:id/responses', addResponse);

module.exports = router;