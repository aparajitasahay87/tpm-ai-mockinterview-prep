const express = require('express');
const router = express.Router();
const { refreshToken } = require('../middleware/authMiddleware');

// Route for token refresh
router.post('/refresh', refreshToken);

module.exports = router;