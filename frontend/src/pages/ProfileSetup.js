import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../Auth.css';

const ProfileSetup = () => {
  const [name, setName] = useState('');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const profileData = {
        name,
        skills: skills.split(','), // Convert to array
        interests: interests.split(','), // Convert to array
      };
      await api.updateProfile(profileData, token);
      setSuccess('Profile updated successfully');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleSkip = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Profile Setup</h2>
        <p className="auth-subtitle">You can fill these details now or skip to do it later.</p>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="name" className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
            />
          </Form.Group>
          <Form.Group controlId="skills" className="mb-3">
            <Form.Label>Skills (comma-separated)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="auth-input"
            />
          </Form.Group>
          <Form.Group controlId="interests" className="mb-3">
            <Form.Label>Interests (comma-separated)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="auth-input"
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="auth-button">
            Save
          </Button>
          <Button variant="secondary" onClick={handleSkip} className="auth-button">
            Skip for Later
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default ProfileSetup;