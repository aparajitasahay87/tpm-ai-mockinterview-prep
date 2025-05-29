// src/components/Layout.js
import React from 'react';

const Layout = ({ children }) => {
    return (
        // This 'app-container' div will apply the max-width, centering, and padding
        // for your main content area, excluding the Navbar which is already global.
        <div className="app-container">
            <main className="app-main">
                {children} {/* This is where your page content (Routes) will be rendered */}
            </main>

            <footer className="app-footer">
                <p>&copy; 2025 MockInterviewAI. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Layout;