import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing-page">
      {/* Header */}
      <div className="header">
        <div className="logo">📚 Learn-E</div>
      </div>

      {/* Main Content */}
      <div className="container">
        {/* Left Section */}
        <div className="left-section">
          <h1>Welcome to Learn-E</h1>
          <p>Your go-to platform for interactive and efficient e-learning.</p>
          <div className="image-container">
            <img src="/elearn.avif" alt="Learning Theme Image" />
          </div>
        </div>

        {/* Right Section */}
        <div className="right-section">
          <h2>Get Started</h2>
          <p>Sign up or log in to begin your learning journey with us.</p>
          <div className="buttons">
            <Link to="/signup">Sign Up</Link>
            <Link to="/login">Login</Link>
          </div>
          <div className="become-tutor">
            <h3>Become a Tutor</h3>
            <p>Share your knowledge and earn while teaching</p>
            <Link to="/signup" className="tutor-button">Join as Tutor</Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <p>© 2024 Learn-E. All rights reserved.</p>
        <div>
          <a href="#">Privacy Policy</a> |
          <a href="#">Terms of Service</a> |
          <a href="#">Contact Us</a>
        </div>
      </div>
    </div>
  );
};

export default Landing; 