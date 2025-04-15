import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProfileSetup from './pages/ProfileSetup';
import Profile from './pages/Profile';
import Landing from './pages/Landing';
import CareerGuidance from './pages/CareerGuidance';
import './index.css';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Container fluid className="content-container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/career-guidance" element={<CareerGuidance />} />
              <Route path="/" element={<Landing />} /> {/* Default route */}
            </Routes>
          </Container>
        </main>
        <footer className="app-footer">
          <Container>
            <div className="footer-content">
              <p className="mb-0">© 2023 E-Learning Platform. All rights reserved.</p>
              <div className="footer-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Contact Us</a>
              </div>
            </div>
          </Container>
        </footer>
      </div>
    </Router>
  );
};

export default App;