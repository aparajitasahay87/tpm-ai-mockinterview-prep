// src/components/LogoutButton.js
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Optionally, redirect the user to the login page or update state
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
}

export default LogoutButton;