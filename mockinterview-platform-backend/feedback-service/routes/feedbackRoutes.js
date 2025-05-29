const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const verifyAppToken = require('../middleware/appAuthMiddleware');

// --- START DEBUGGING LOGS ---
console.log('--- Debugging Routes Initialization ---');
console.log('Type of verifyAppToken:', typeof verifyAppToken);
console.log('Is verifyAppToken truthy?', !!verifyAppToken); // Check if it's not null/undefined
console.log('Type of feedbackController:', typeof feedbackController);
console.log('Is feedbackController truthy?', !!feedbackController); // Check if it's not null/undefined
console.log('Type of feedbackController.getInterviewFeedback:', typeof feedbackController.getInterviewFeedback);
console.log('Is feedbackController.getInterviewFeedback truthy?', !!feedbackController.getInterviewFeedback); // Check if it's not null/undefined
console.log('--- END Debugging Routes Initialization ---');
// --- END DEBUGGING LOGS ---
// Route for getting interview feedback
router.post('/feedback', verifyAppToken, feedbackController.getInterviewFeedback);

router.post('/feedback/save-response', verifyAppToken, feedbackController.saveUserResponse);

// Route to save user feedback to the database
//router.post('/save-feedback', verifyAppToken, feedbackController.saveUserFeedback);

module.exports = router;

/*const express = require('express');
const router = express.Router();

const UserFeedback = require('../models/userFeedback');

router.post('/test-feedback', async (req, res) => {
  try {
    const dummy = new UserFeedback({
      userId: 'test123',
      response: 'Sample response',
      feedback: 'Sample feedback'
    });
    await dummy.save();
    res.json({ message: 'Dummy saved!' });
  } catch (err) {
    console.error('Dummy save error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
*/

  
