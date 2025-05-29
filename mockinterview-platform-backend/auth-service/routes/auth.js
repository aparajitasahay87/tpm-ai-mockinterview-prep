// auth-service/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Firebase authentication route
router.post('/verify-firebase', authController.verifyFirebaseToken);

// Token refresh route
router.post('/refresh-token', authController.refreshToken);


module.exports = router;