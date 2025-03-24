import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProfileSetup from './pages/ProfileSetup';
import Profile from './pages/Profile';
import CareerGuidance from './pages/CareerGuidance';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Container className="mt-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/career-guidance" element={<CareerGuidance />} />
          <Route path="/" element={<Login />} /> {/* Default route */}
        </Routes>
      </Container>
    </Router>
  );
};

export default App;