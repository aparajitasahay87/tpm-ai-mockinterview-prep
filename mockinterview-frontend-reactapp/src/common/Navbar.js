// src/common/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { signOut } from 'firebase/auth';
import { auth } from '../firebase'; // Assuming '../firebase' points to your Firebase config and auth instance

function Navbar({ user, onOpenMarketSurvey }) { // ⭐ ADD onOpenMarketSurvey prop ⭐
  const navigate = useNavigate(); // Get the navigate function

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirect the user to the login page after successful logout
      navigate('/login');
      console.log('User signed out successfully and redirected to login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Basic styling for the button inside li, can be moved to CSS
  const buttonStyle = {
    background: 'none',
    border: 'none',
    color: 'inherit', // Inherit color from li/a or set explicitly
    cursor: 'pointer',
    fontSize: '1em', // Match link font size
    padding: '0', // Remove default button padding
    margin: '0', // Remove default button margin
    textDecoration: 'underline', // Make it look like a link if desired
  };


  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        {/* Your existing conditional login link. It's commented out, but if active, keep its logic */}
        {/*!user && <li><Link to="/login">Login</Link></li>*/}

        {/* ⭐ ADD Market Survey button/link here ⭐ */}
        <li>
          <button onClick={onOpenMarketSurvey} style={buttonStyle}>
            Survey
          </button>
        </li>

        {user && (
          <>
            {/* If you have a dashboard or questions page, add links here for logged-in users */}
           

            <li><span>Welcome, {user.email || user.displayName || 'User'}</span></li>
            <li>
              <button onClick={handleLogout} style={buttonStyle}>Logout</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;