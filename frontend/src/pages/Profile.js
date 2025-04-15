import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { FaUser, FaEdit, FaSave, FaTimes, FaCode, FaStar, FaTrophy } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../assets/default-avatar.png';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    name: '',
    title: '',
    bio: '',
    skills: [],
    interests: [],
    experience: 0,
    projects: 0,
    achievements: 0,
    profileImage: null
  });

  const [editForm, setEditForm] = useState({ ...profileData });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          setEditForm(data);
        } else {
          navigate('/profile-setup');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        navigate('/login');
      }
    };

    fetchProfileData();
  }, [navigate]);

  const handleEdit = () => {
    setEditForm({ ...profileData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedData = await response.json();
        setProfileData(updatedData);
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('An error occurred while updating your profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setEditForm({ ...editForm, profileImage: base64String });
        setError('');
      };
      reader.onerror = () => {
        setError('Error reading the image file');
      };
      reader.readAsDataURL(file);
    }
  };

  // Get the profile image source
  const getProfileImageSrc = () => {
    if (isEditing) {
      return editForm.profileImage || defaultAvatar;
    }
    return profileData.profileImage || defaultAvatar;
  };

  return (
    <div className="page-container py-5">
      <Container fluid>
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="profile-card shadow-sm">
              <Card.Body className="p-4">
                {error && <Alert variant="danger">{error}</Alert>}
                
                {!isEditing ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="profile-image-wrapper">
                        <img
                          src={getProfileImageSrc()}
                          alt="Profile"
                          className="profile-image"
                        />
                      </div>
                      <h2 className="mt-3">{profileData.name || 'Complete Your Profile'}</h2>
                      <p className="text-muted">{profileData.title || 'Add your title'}</p>
                      <Button variant="outline-primary" onClick={handleEdit}>
                        <FaEdit className="me-2" />
                        Edit Profile
                      </Button>
                    </div>

                    <Row className="mb-4">
                      <Col md={4}>
                        <Card className="stat-card text-center p-3">
                          <FaCode className="stat-icon" />
                          <div className="stat-value">{profileData.experience}</div>
                          <div className="text-muted">Years Experience</div>
                        </Card>
                      </Col>
                      <Col md={4}>
                        <Card className="stat-card text-center p-3">
                          <FaStar className="stat-icon" />
                          <div className="stat-value">{profileData.projects}</div>
                          <div className="text-muted">Projects</div>
                        </Card>
                      </Col>
                      <Col md={4}>
                        <Card className="stat-card text-center p-3">
                          <FaTrophy className="stat-icon" />
                          <div className="stat-value">{profileData.achievements}</div>
                          <div className="text-muted">Achievements</div>
                        </Card>
                      </Col>
                    </Row>

                    <div className="mb-4">
                      <h4 className="section-title">About Me</h4>
                      <p className="bio-text">{profileData.bio || 'Add your bio to let others know about you.'}</p>
                    </div>

                    <div className="mb-4">
                      <h4 className="section-title">Skills</h4>
                      <div className="skills-container">
                        {profileData.skills && profileData.skills.length > 0 ? (
                          profileData.skills.map((skill, index) => (
                            <span key={index} className="skill-badge">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-muted">Add your skills</p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="section-title">Interests</h4>
                      <div className="skills-container">
                        {profileData.interests && profileData.interests.length > 0 ? (
                          profileData.interests.map((interest, index) => (
                            <span key={index} className="skill-badge">
                              {interest}
                            </span>
                          ))
                        ) : (
                          <p className="text-muted">Add your interests</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <Form className="edit-form">
                    <div className="text-center mb-4">
                      <div className="profile-image-wrapper">
                        <img
                          src={getProfileImageSrc()}
                          alt="Profile"
                          className="profile-image"
                        />
                      </div>
                      <Form.Group className="mb-3">
                        <Form.Label>Profile Image</Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                        <Form.Text className="text-muted">
                          Recommended size: 200x200px, max 5MB
                        </Form.Text>
                      </Form.Group>
                    </div>

                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Enter your name"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Title</Form.Label>
                      <Form.Control
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Enter your professional title"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Bio</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="Tell us about yourself"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Skills (comma-separated)</Form.Label>
                      <Form.Control
                        type="text"
                        value={editForm.skills ? editForm.skills.join(', ') : ''}
                        onChange={(e) => setEditForm({ ...editForm, skills: e.target.value.split(',').map(s => s.trim()) })}
                        placeholder="e.g., React, Node.js, Python"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Interests (comma-separated)</Form.Label>
                      <Form.Control
                        type="text"
                        value={editForm.interests ? editForm.interests.join(', ') : ''}
                        onChange={(e) => setEditForm({ ...editForm, interests: e.target.value.split(',').map(s => s.trim()) })}
                        placeholder="e.g., Machine Learning, Web Development"
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2">
                      <Button variant="secondary" onClick={handleCancel}>
                        <FaTimes className="me-2" />
                        Cancel
                      </Button>
                      <Button variant="primary" onClick={handleSave}>
                        <FaSave className="me-2" />
                        Save Changes
                      </Button>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Profile;