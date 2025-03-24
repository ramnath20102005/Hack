import React, { useState, useEffect } from 'react';
import { Alert, Card, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CareerGuidance = () => {
  const [guidance, setGuidance] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGuidance = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await api.getProfile(token);
          const skills = profile.skills.join(', ');
          const interests = profile.interests.join(', ');
          const prompt = `Based on the following skills and interests, provide career guidance and future job trends:
          Skills: ${skills}
          Interests: ${interests}
          `;
          // Call OpenAI API or your backend API for career guidance
          // For now, we'll just display the prompt
          setGuidance(prompt);
        } catch (err) {
          setError('Failed to fetch career guidance');
        }
      } else {
        navigate('/login');
      }
    };
    fetchGuidance();
  }, [navigate]);

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '500px', padding: '20px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Career Guidance</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <pre>{guidance}</pre>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CareerGuidance;