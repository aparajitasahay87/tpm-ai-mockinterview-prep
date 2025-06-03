// auth-service/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const { initializeFirebaseAdmin } = require('./config/firebaseConfig');
const errorHandler = require('./middleware/errorMiddleware');

dotenv.config();

const allowedOrigins = process.env.CORS_ORIGIN || 'http://localhost:3000'; // Default to localhost for local dev
const app = express();
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
const PORT = process.env.AUTH_PORT || 4001; // Different port for auth service

initializeFirebaseAdmin(); // Initialize Firebase Admin SDK

app.use('/auth', authRoutes);

app.use(errorHandler);

/*app.listen(PORT, () => {
  console.log(`Auth service listening on port ${PORT}`);
});
*/
const actualPort = process.env.PORT || PORT;
app.listen(actualPort, () => {
  console.log(`Auth Service running on port ${actualPort}`);
});