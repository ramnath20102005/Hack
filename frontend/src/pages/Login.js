import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userId', data._id);

        // Redirect to home page
        navigate('/home');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Container fluid>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col md={10} lg={8} xl={6}>
            <Card className="login-card">
              <Card.Body className="p-md-5">
                <div className="text-center mb-5">
                  <h1 className="login-title">Welcome Back!</h1>
                  <p className="login-subtitle">Please login to continue your learning journey</p>
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

                    <Col lg={12}>
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
                            placeholder="Enter your password"
                            required
                            size="lg"
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    <Col lg={12}>
                      <Form.Group className="mb-4">
                        <Form.Label>Login As</Form.Label>
                        <div className="role-selector">
                          <Button
                            variant={formData.role === 'student' ? 'primary' : 'outline-primary'}
                            className="role-button"
                            onClick={() => setFormData({ ...formData, role: 'student' })}
                          >
                            <FaUserGraduate className="me-2" />
                            Student
                          </Button>
                          <Button
                            variant={formData.role === 'instructor' ? 'primary' : 'outline-primary'}
                            className="role-button"
                            onClick={() => setFormData({ ...formData, role: 'instructor' })}
                          >
                            <FaChalkboardTeacher className="me-2" />
                            Instructor
                          </Button>
                        </div>
          </Form.Group>
                    </Col>

                    <Col lg={12}>
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-100 mb-3"
                        disabled={loading}
                      >
                        {loading ? 'Logging in...' : 'Login'}
          </Button>
                    </Col>

                    <Col lg={12} className="text-center">
                      <p className="mb-0">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-primary">
                          Sign up
                        </Link>
                      </p>
                    </Col>
                  </Row>
        </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;