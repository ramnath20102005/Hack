import React, { useState, useEffect } from 'react';
import { Button, Alert, Card, Container, Row, Col, ProgressBar, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Profile.css';

const Profile = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [profileImage, setProfileImage] = useState('http://localhost:5000/public/default-profile.jpg'); // Default image
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  // Fetch profile data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login'); // Redirect to login if no token
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const profile = response.data;
        setName(profile.name);
        setEmail(profile.email);
        setBio(profile.bio);
        setSkills(profile.skills || []);
        setInterests(profile.interests || []);
        setAchievements(profile.achievements || []);
        setProfileImage(profile.profileImage || 'http://localhost:5000/public/default-profile.jpg'); // Default image if none
      } catch (err) {
        setError('Failed to fetch profile');
      }
    };
    fetchProfile();
  }, [navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('skills', JSON.stringify(skills)); // Send as JSON string
      formData.append('interests', JSON.stringify(interests)); // Send as JSON string
      formData.append('achievements', JSON.stringify(achievements)); // Send as JSON string

      // Append the image file if it's updated
      if (e.target.profileImage?.files[0]) {
        formData.append('profileImage', e.target.profileImage.files[0]);
      }

      const response = await axios.put('http://localhost:5000/api/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update state with the new data
      setName(response.data.name);
      setBio(response.data.bio);
      setSkills(response.data.skills || []);
      setInterests(response.data.interests || []);
      setAchievements(response.data.achievements || []);
      setProfileImage(response.data.profileImage || 'http://localhost:5000/public/default-profile.jpg');

      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token from local storage
    navigate('/login'); // Redirect to login page
  };

  return (
    <Container className="profile-container">
      <Card className="profile-card">
        <Card.Body>
          {/* Top Section */}
          <Row className="mb-5">
            {/* Left Side: Profile Picture and Basic Info */}
            <Col md={4} className="text-center">
              <div className="profile-image-wrapper">
                <img
                  src={profileImage || 'http://localhost:5000/public/default-profile.jpg'} // Use the correct URL
                  alt="Profile"
                  className="profile-image"
                />
              </div>
              <h3 className="mt-3">{name}</h3>
              <p className="text-muted">{email}</p>
              {!isEditing && (
                <Button variant="link" className="text-primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
              <Button variant="danger" onClick={handleLogout} className="mt-2">
                Logout
              </Button>
            </Col>

            {/* Right Side: Quick Stats */}
            <Col md={8}>
              <h4 className="section-title">Quick Stats</h4>
              <Row>
                <Col>
                  <Card className="stat-card">
                    <Card.Body>
                      <Card.Title>Courses Completed</Card.Title>
                      <Card.Text className="stat-value">5</Card.Text>
                      <Card.Text className="text-muted">Total courses you've completed.</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col>
                  <Card className="stat-card">
                    <Card.Body>
                      <Card.Title>Progress</Card.Title>
                      <div>
                        <ProgressBar now={75} label={`${75}%`} className="custom-progress-bar" />
                      </div>
                      <Card.Text className="text-muted">Your overall learning progress.</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col>
                  <Card className="stat-card">
                    <Card.Body>
                      <Card.Title>AI Tutor Rating</Card.Title>
                      <Card.Text className="stat-value">4.5/5</Card.Text>
                      <Card.Text className="text-muted">Based on your interactions.</Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>

          {/* Center Section: Bio and AI Insights */}
          <Row className="mb-5">
            <Col>
              {isEditing ? (
                <Form onSubmit={handleSubmit}>
                  <Form.Group controlId="name" className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="bio" className="mb-3">
                    <Form.Label>Bio</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Enter bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="skills" className="mb-3">
                    <Form.Label>Skills (comma-separated)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter skills"
                      value={skills.join(',')}
                      onChange={(e) => setSkills(e.target.value.split(','))}
                    />
                  </Form.Group>
                  <Form.Group controlId="interests" className="mb-3">
                    <Form.Label>Interests (comma-separated)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter interests"
                      value={interests.join(',')}
                      onChange={(e) => setInterests(e.target.value.split(','))}
                    />
                  </Form.Group>
                  <Form.Group controlId="achievements" className="mb-3">
                    <Form.Label>Achievements (comma-separated)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter achievements"
                      value={achievements.join(',')}
                      onChange={(e) => setAchievements(e.target.value.split(','))}
                    />
                  </Form.Group>
                  <Form.Group controlId="profileImage" className="mb-3">
                    <Form.Label>Profile Picture</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      name="profileImage" // Ensure the name matches the backend expectation
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="me-2">
                    Save Changes
                  </Button>
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </Form>
              ) : (
                <>
                  <h4 className="section-title">About Me</h4>
                  <p className="bio-text">{bio}</p>

                  <h4 className="section-title">Skills</h4>
                  <ul className="skills-list">
                    {skills.map((skill, index) => (
                      <li key={index} className="skill-item">
                        {skill}
                      </li>
                    ))}
                  </ul>

                  <h4 className="section-title">AI-Driven Insights</h4>
                  <Card className="insight-card">
                    <Card.Body>
                      <Card.Title>Learning Path</Card.Title>
                      <Card.Text>Your personalized learning journey.</Card.Text>
                    </Card.Body>
                  </Card>
                </>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Profile;