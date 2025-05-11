import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProfileSetup from './pages/ProfileSetup';
import Profile from './pages/Profile';
import Landing from './pages/Landing';
import CareerGuidance from './pages/CareerGuidance';
import HomeInstructor from './pages/HomeInstructor';
import CourseManagement from './pages/CourseManagement';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import AssignmentAttempt from './pages/AssignmentAttempt';
import InstructorPage from './pages/InstructorPage';
import './index.css';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Container fluid className="content-container">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/register" element={<Signup />} />
              <Route path="/home" element={<Home />} />
              <Route path="/home-instructor" element={<HomeInstructor />} />
              <Route path="/instructor" element={<InstructorPage />} />
              <Route path="/course/:courseId" element={<CourseDetail />} />
              <Route path="/instructor/course/:courseId" element={<CourseManagement />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/career-guidance" element={<CareerGuidance />} />
              <Route path="/assignment/:assignmentId" element={<AssignmentAttempt />} />
            </Routes>
          </Container>
        </main>
        <footer className="app-footer">
          <Container>
            <div className="footer-content">
              <p className="mb-0">© 2023 E-Learning Platform. All rights reserved.</p>
              <div className="footer-links">
                <Link to="/privacy-policy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
                <Link to="/contact">Contact Us</Link>
              </div>
            </div>
          </Container>
        </footer>
      </div>
    </Router>
  );
};

export default App;