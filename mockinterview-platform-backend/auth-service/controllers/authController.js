const { getFirebaseAdmin } = require('../config/firebaseConfig');
const { query } = require('../config/database');
const jwt = require('jsonwebtoken');

exports.verifyFirebaseToken = async (req, res) => {
  const { firebaseIdToken } = req.body;

  if (!firebaseIdToken) {
    return res.status(400).json({ 
      message: 'Firebase ID token not provided.',
      error: 'missing_firebase_token'
    });
  }

  try {
    const decodedToken = await getFirebaseAdmin().auth().verifyIdToken(firebaseIdToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email || '';

    // ⭐ NEW: User creation/sync in local 'users' table ⭐
    try {
        // Check if user already exists in your local 'users' table
        const userCheckResult = await query('SELECT user_id FROM users WHERE user_id = $1', [uid]);

        if (userCheckResult.rows.length === 0) {
            // User does NOT exist in your local DB, so create them
            console.log(`Auth Service: Creating new user in local DB for UID: ${uid}`);
            const insertUserQuery = `
                INSERT INTO users (user_id, email, created_at, account_type, feedback_count)
                VALUES ($1, $2, NOW(), 'free', 0)
                ON CONFLICT (user_id) DO NOTHING; -- Prevents errors if concurrent inserts happen
            `;
            await query(insertUserQuery, [uid, email]);
            console.log(`Auth Service: User ${uid} successfully created in local DB with account_type 'free'.`);
        } else {
            console.log(`Auth Service: User ${uid} already exists in local DB. No new entry needed.`);
            // Optional: You could update last_login_at here if you track it
        }
    } catch (dbError) {
        console.error('Auth Service: Error syncing user to local DB:', dbError);
        // Decide how to handle this. You might still proceed with token generation
        // but log the DB sync failure, or return an error if DB sync is critical.
        // For now, we'll log and still try to issue tokens.
        // If DB sync is absolutely critical before issuing a token, uncomment the line below:
        // return res.status(500).json({ message: 'Failed to sync user data.', error: 'db_sync_failed' });
    }
    // ⭐ END NEW USER SYNC LOGIC ⭐

    // Check if JWT secrets are configured
    if (!process.env.JWT_SECRET_KEY) {
      console.error('JWT_SECRET_KEY is not set in the environment.');
      return res.status(500).json({ 
        message: 'Server configuration error',
        error: 'jwt_config_error'
      });
    }

    // Generate access token (short-lived)
    const appToken = jwt.sign(
      { uid: uid, email: email }, 
      process.env.JWT_SECRET_KEY, 
      {
        expiresIn: process.env.JWT_EXPIRATION_TIME || '1h'
      }
    );

    // Generate refresh token (long-lived) - only if refresh secret is available
    let refreshToken = null;
    if (process.env.JWT_REFRESH_SECRET) {
      refreshToken = jwt.sign(
        { uid: uid },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
      );
    }

    // Return tokens
    const response = { 
      appToken,
      expiresIn: process.env.JWT_EXPIRATION_TIME || '1h',
      uid: uid
    };

    // Only include refresh token if it was generated
    if (refreshToken) {
      response.refreshToken = refreshToken;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        message: 'Firebase ID token has expired. Please reauthenticate.',
        error: 'firebase_token_expired'
      });
    }
    
    return res.status(401).json({ 
      message: 'Invalid Firebase ID token.',
      error: 'invalid_firebase_token'
    });
  }
};

// Token refresh endpoint
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ 
      message: 'Refresh token is required',
      error: 'missing_refresh_token'
    });
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    console.error('JWT_REFRESH_SECRET is not set in the environment.');
    return res.status(500).json({ 
      message: 'Server configuration error: Refresh tokens not supported',
      error: 'refresh_config_error'
    });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const uid = decoded.uid;
    
    // Generate a new access token
    const newAppToken = jwt.sign(
      { 
        uid: uid,
        email: decoded.email || ''
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.JWT_EXPIRATION_TIME || '1h' }
    );
    
    // Optionally generate a new refresh token for rotation
    const newRefreshToken = jwt.sign(
      { uid: uid },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
    );
    
    return res.status(200).json({
      appToken: newAppToken,
      refreshToken: newRefreshToken,
      expiresIn: process.env.JWT_EXPIRATION_TIME || '1h',
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Refresh token expired, please login again',
        error: 'refresh_token_expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid refresh token',
        error: 'invalid_refresh_token'
      });
    } else {
      return res.status(401).json({ 
        message: 'Token refresh failed',
        error: 'refresh_failed'
      });
    }
  }
};