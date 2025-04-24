import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCode, FaLightbulb } from 'react-icons/fa';
import './ProfileSetup.css';

const ProfileSetup = () => {
  const [formData, setFormData] = useState({
    name: '',
    skills: '',
    interests: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const profileData = {
        name: formData.name,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s), // Convert to array and remove empty
        interests: formData.interests.split(',').map(s => s.trim()).filter(s => s), // Convert to array and remove empty
        bio: formData.bio
      };

      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        setSuccess('Profile updated successfully');
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  const handleSkip = () => {
    navigate('/profile');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Complete Your Profile</h2>
        <p className="auth-subtitle">Tell us more about yourself to get started</p>
        
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="form-group">
            <Form.Label>
              <FaUser className="me-2" />
              Full Name
            </Form.Label>
            <Form.Control
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              className="auth-input"
              required
            />
          </Form.Group>

          <Form.Group className="form-group">
            <Form.Label>
              <FaCode className="me-2" />
              Skills
            </Form.Label>
            <Form.Control
              type="text"
              name="skills"
              placeholder="Enter your skills (comma-separated)"
              value={formData.skills}
              onChange={handleChange}
              className="auth-input"
            />
            <Form.Text className="text-muted">
              Example: React, Node.js, Python, Data Analysis
            </Form.Text>
          </Form.Group>

          <Form.Group className="form-group">
            <Form.Label>
              <FaLightbulb className="me-2" />
              Interests
            </Form.Label>
            <Form.Control
              type="text"
              name="interests"
              placeholder="Enter your interests (comma-separated)"
              value={formData.interests}
              onChange={handleChange}
              className="auth-input"
            />
            <Form.Text className="text-muted">
              Example: Web Development, Machine Learning, UI/UX Design
            </Form.Text>
          </Form.Group>

          <Form.Group className="form-group">
            <Form.Label>
              Bio
            </Form.Label>
            <Form.Control
              as="textarea"
              name="bio"
              rows={4}
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={handleChange}
              className="auth-input"
            />
          </Form.Group>

          <Button type="submit" className="auth-button">
            Save Profile
          </Button>
          <Button variant="secondary" onClick={handleSkip} className="auth-button">
            Skip for Now
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default ProfileSetup;