import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, ProgressBar, Alert, Modal } from 'react-bootstrap';
import { FaFilePdf, FaVideo, FaTrash, FaCalendarAlt, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './CourseManagement.css';

const CourseManagement = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState(location.state?.course || null);
  const [material, setMaterial] = useState({
    title: '',
    type: 'pdf',
    file: null
  });
  const [liveClass, setLiveClass] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    meetingLink: ''
  });
  const [showLiveClassModal, setShowLiveClassModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');

  const fetchCourse = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setCourse(response.data);
    } catch (err) {
      console.error('Error fetching course:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to fetch course details');
      }
    }
  }, [courseId, navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'instructor') {
      navigate('/login');
      return;
    }

    if (!course) {
      fetchCourse();
    }
  }, [navigate, course, fetchCourse]);

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!material.file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', material.title);
      formData.append('type', material.type);
      formData.append('file', material.file);

      await axios.post(`http://localhost:5000/api/courses/${courseId}/materials`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setMaterial({ ...material, title: '', file: null });
      setUploadProgress(0);
      setSuccess('Material uploaded successfully');
      fetchCourse();
    } catch (err) {
      console.error('Error uploading material:', err);
      setError('Failed to upload material');
    }
  };

  const handleLiveClassSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/courses/${courseId}/live-class`, liveClass, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setShowLiveClassModal(false);
      setLiveClass({
        title: '',
        date: '',
        time: '',
        duration: '60',
        meetingLink: ''
      });
      setSuccess('Live class scheduled successfully');
      fetchCourse();
    } catch (err) {
      console.error('Error scheduling live class:', err);
      setError('Failed to schedule live class');
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/api/courses/${courseId}/materials/${materialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.msg === 'Material deleted successfully') {
        setSuccess('Material deleted successfully');
        // Update the course state by removing the deleted material
        setCourse(prevCourse => ({
          ...prevCourse,
          materials: prevCourse.materials.filter(material => material._id !== materialId)
        }));
      } else {
        setError(response.data.msg || 'Failed to delete material');
      }
    } catch (err) {
      console.error('Error deleting material:', err);
      setError(err.response?.data?.msg || 'Failed to delete material');
    }
  };

  const handleDeleteLiveClass = async (classId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/${courseId}/live-class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Live class deleted successfully');
      fetchCourse();
    } catch (err) {
      setError('Failed to delete live class');
    }
  };

  const handleDeleteCourse = async () => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all associated materials and cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.msg === 'Course and all associated materials deleted successfully') {
          setSuccess('Course deleted successfully');
          navigate('/instructor');
        } else {
          setError(response.data.msg || 'Failed to delete course');
        }
      } catch (err) {
        console.error('Error deleting course:', err);
        setError(err.response?.data?.msg || 'Failed to delete course');
      }
    }
  };

  if (!course) {
    return <div>Loading...</div>;
  }

  return (
    <Container fluid className="course-management">
      <Row>
        <Col md={12} className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>{course?.title || 'Loading...'}</h2>
            <p className="text-muted">{course?.description || 'Loading course details...'}</p>
          </div>
          <Button
            variant="danger"
            onClick={handleDeleteCourse}
            className="delete-course-btn"
          >
            <FaTrash className="me-2" />
            Delete Course
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        {/* Live Classes Section */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title>Live Classes</Card.Title>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowLiveClassModal(true)}
                >
                  <FaCalendarAlt className="me-2" />
                  Schedule Live Class
                </Button>
              </div>

              {course?.liveClasses?.length > 0 ? (
                <div className="live-classes-list">
                  {course.liveClasses.map((liveClass) => (
                    <div key={liveClass._id} className="live-class-item">
                      <div>
                        <strong>{liveClass.title}</strong>
                        <div>Date: {new Date(liveClass.date).toLocaleDateString()}</div>
                        <div>Time: {liveClass.time}</div>
                        <div>Duration: {liveClass.duration} minutes</div>
                        <a href={liveClass.meetingLink} target="_blank" rel="noopener noreferrer">
                          Join Class
                        </a>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteLiveClass(liveClass._id)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No live classes scheduled yet.</p>
                  <Button
                    variant="outline-primary"
                    onClick={() => setShowLiveClassModal(true)}
                  >
                    <FaPlus className="me-2" />
                    Schedule Your First Class
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Course Materials Section */}
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Course Materials</Card.Title>
              <Form onSubmit={handleMaterialSubmit} className="mb-4">
                <Form.Group className="mb-3">
                  <Form.Label>Material Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={material.title}
                    onChange={(e) => setMaterial({ ...material, title: e.target.value })}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Material Type</Form.Label>
                  <div className="material-type-selector">
                    <Form.Check
                      type="radio"
                      label="PDF"
                      name="materialType"
                      value="pdf"
                      checked={material.type === 'pdf'}
                      onChange={(e) => setMaterial({ ...material, type: e.target.value })}
                    />
                    <Form.Check
                      type="radio"
                      label="Video"
                      name="materialType"
                      value="video"
                      checked={material.type === 'video'}
                      onChange={(e) => setMaterial({ ...material, type: e.target.value })}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Upload File</Form.Label>
                  <Form.Control
                    type="file"
                    accept={material.type === 'pdf' ? '.pdf' : 'video/*'}
                    onChange={(e) => setMaterial({ ...material, file: e.target.files[0] })}
                    required
                  />
                </Form.Group>

                {uploadProgress > 0 && (
                  <ProgressBar
                    now={uploadProgress}
                    label={`${uploadProgress}%`}
                    className="mb-3"
                  />
                )}

                <Button type="submit" variant="primary">
                  Upload Material
                </Button>
              </Form>

              {course?.materials?.length > 0 ? (
                <div className="materials-list">
                  {course.materials.map((material) => (
                    <div key={material._id} className="material-item">
                      <div className="material-info">
                        {material.type === 'pdf' ? <FaFilePdf /> : <FaVideo />}
                        <span>{material.title}</span>
                      </div>
                      <div className="material-actions">
                        {material.type === 'pdf' ? (
                          <a
                            href={`http://localhost:5000${material.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm me-2"
                          >
                            View PDF
                          </a>
                        ) : (
                          <a
                            href={`http://localhost:5000${material.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm me-2"
                          >
                            Watch Video
                          </a>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteMaterial(material._id)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No materials uploaded yet.</p>
                  <p className="text-muted">Upload your first PDF or video to get started.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Live Class Modal */}
      <Modal show={showLiveClassModal} onHide={() => setShowLiveClassModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Schedule Live Class</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleLiveClassSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Class Title</Form.Label>
              <Form.Control
                type="text"
                value={liveClass.title}
                onChange={(e) => setLiveClass({ ...liveClass, title: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={liveClass.date}
                onChange={(e) => setLiveClass({ ...liveClass, date: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Time</Form.Label>
              <Form.Control
                type="time"
                value={liveClass.time}
                onChange={(e) => setLiveClass({ ...liveClass, time: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Duration (minutes)</Form.Label>
              <Form.Control
                type="number"
                value={liveClass.duration}
                onChange={(e) => setLiveClass({ ...liveClass, duration: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Meeting Link</Form.Label>
              <Form.Control
                type="text"
                value={liveClass.meetingLink}
                onChange={(e) => setLiveClass({ ...liveClass, meetingLink: e.target.value })}
                placeholder="e.g., https://meet.google.com/xxx-xxxx-xxx"
                required
              />
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100">
              Schedule Class
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CourseManagement; 