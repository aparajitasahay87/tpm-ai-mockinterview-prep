// auth-service/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const { initializeFirebaseAdmin } = require('./config/firebaseConfig');
const errorHandler = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.AUTH_PORT || 4001; // Different port for auth service

app.use(cors());
app.use(express.json());

initializeFirebaseAdmin(); // Initialize Firebase Admin SDK

app.use('/auth', authRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Auth service listening on port ${PORT}`);
});