import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userName', data.name);
        navigate('/profile-setup');
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <Container fluid>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col md={10} lg={8} xl={6}>
            <Card className="signup-card">
              <Card.Body className="p-md-5">
                <div className="text-center mb-5">
                  <h1 className="signup-title">Create Account</h1>
                  <p className="signup-subtitle">Join our learning community today</p>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col lg={12}>
                      <Form.Group className="mb-4">
                        <Form.Label>Full Name</Form.Label>
                        <div className="input-group input-group-lg">
                          <div className="input-group-prepend">
                            <span className="input-group-text">
                              <FaUser />
                            </span>
                          </div>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                            size="lg"
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    <Col lg={12}>
                      <Form.Group className="mb-4">
                        <Form.Label>Email Address</Form.Label>
                        <div className="input-group input-group-lg">
                          <div className="input-group-prepend">
                            <span className="input-group-text">
                              <FaEnvelope />
                            </span>
                          </div>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                            size="lg"
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    <Col lg={6}>
                      <Form.Group className="mb-4">
                        <Form.Label>Password</Form.Label>
                        <div className="input-group input-group-lg">
                          <div className="input-group-prepend">
                            <span className="input-group-text">
                              <FaLock />
                            </span>
                          </div>
                          <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create password"
                            required
                            size="lg"
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    <Col lg={6}>
                      <Form.Group className="mb-4">
                        <Form.Label>Confirm Password</Form.Label>
                        <div className="input-group input-group-lg">
                          <div className="input-group-prepend">
                            <span className="input-group-text">
                              <FaLock />
                            </span>
                          </div>
                          <Form.Control
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm password"
                            required
                            size="lg"
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    <Col lg={12}>
                      <Form.Group className="mb-4">
                        <Form.Label>Select Your Role</Form.Label>
                        <div className="role-selector">
                          <Form.Check
                            type="radio"
                            id="student"
                            name="role"
                            value="student"
                            checked={formData.role === 'student'}
                            onChange={handleChange}
                            label={
                              <div className="role-option">
                                <FaUserGraduate className="role-icon" />
                                <span>Student</span>
                              </div>
                            }
                            className="role-radio"
                          />
                          <Form.Check
                            type="radio"
                            id="instructor"
                            name="role"
                            value="instructor"
                            checked={formData.role === 'instructor'}
                            onChange={handleChange}
                            label={
                              <div className="role-option">
                                <FaChalkboardTeacher className="role-icon" />
                                <span>Instructor</span>
                              </div>
                            }
                            className="role-radio"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="form-actions">
                    <Button
                      variant="primary"
                      type="submit"
                      className="signup-button"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>

                    <div className="text-center mt-4">
                      <p className="mb-0">
                        Already have an account?{' '}
                        <Link to="/login" className="login-link">
                          Login
                        </Link>
                      </p>
                    </div>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Signup;