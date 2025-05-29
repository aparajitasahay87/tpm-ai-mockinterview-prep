const admin = require('firebase-admin');
let firebaseAdmin;

const initializeFirebaseAdmin = () => {
  if (!firebaseAdmin) {
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      // databaseURL: process.env.FIREBASE_DATABASE_URL, // If you use Realtime Database
    });
  }
  return firebaseAdmin;
};

const getFirebaseAdmin = () => {
  if (!firebaseAdmin) {
    throw new Error('Firebase Admin SDK not initialized.');
  }
  return firebaseAdmin;
};

module.exports = { initializeFirebaseAdmin, getFirebaseAdmin };