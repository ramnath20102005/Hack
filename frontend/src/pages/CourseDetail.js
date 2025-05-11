import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Tab, Nav, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { 
  FaBook, 
  FaCalendarAlt, 
  FaUserGraduate, 
  FaFileAlt, 
  FaVideo, 
  FaClock, 
  FaStar, 
  FaCheckCircle,
  FaUser,
  FaCalendarCheck,
  FaDownload,
  FaPlayCircle,
  FaTrophy,
  FaClipboardList
} from 'react-icons/fa';
import Chatbot from '../components/Chatbot';
import './CourseDetail.css';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'instructor') {
      navigate('/instructor');
      return;
    }
    const fetchCourseDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        if (response.status === 403) {
          setError('You need to enroll in this course to view its details');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch course details');
        }

        const data = await response.json();
        if (!data.course) {
          throw new Error('Course not found');
        }

        setCourse(data.course);
        setError(null);
      } catch (error) {
        console.error('Error fetching course details:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchAssignments = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/assignments/course/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAssignments(data);
        }
      } catch (err) {
        console.error('Error fetching assignments:', err);
      }
    };

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/courses/${courseId}/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      }
    };

    fetchCourseDetails();
    fetchAssignments();
    fetchHistory();
  }, [courseId, navigate]);

  const handleStartAssignment = (assignmentId) => {
    navigate(`/assignment/${assignmentId}`);
  };

  const calculateProgress = () => {
    // If there are no assignments, it's a reference course
    if (!assignments || assignments.length === 0) {
      return 100; // Reference courses are considered 100% complete
    }
    
    // If there are assignments but no history, progress is 0
    if (!history?.assignments?.length) {
      return 0;
    }
    
    // Calculate progress based on completed assignments
    const completed = history.assignments.length;
    return Math.round((completed / assignments.length) * 100);
  };

  const isReferenceCourse = () => {
    return !assignments || assignments.length === 0;
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading course details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="primary" onClick={() => navigate('/home')}>
            Back to Home
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          <Alert.Heading>Course Not Found</Alert.Heading>
          <p>The course you're looking for doesn't exist or you don't have access to it.</p>
          <Button variant="primary" onClick={() => navigate('/home')}>
            Back to Home
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="course-detail-container p-0">
      {/* Hero Section */}
      <div className="course-hero">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="course-header-content">
                <h1 className="display-4">{course.title}</h1>
                <p className="lead">{course.description}</p>
                <div className="course-meta-tags">
                  <Badge bg="primary" className="me-2">
                    <FaBook className="me-1" /> {course.level || 'All Levels'}
                  </Badge>
                  <Badge bg="info" className="me-2">
                    <FaClock className="me-1" /> {course.duration || 'Flexible'} weeks
                  </Badge>
                  <Badge bg="success">
                    <FaUserGraduate className="me-1" /> {course.enrolledStudents || 0} Students
                  </Badge>
                </div>
              </div>
            </Col>
            <Col md={4}>
              <Card className="course-progress-card">
                <Card.Body>
                  <h5 className="text-center mb-3">Your Progress</h5>
                  {isReferenceCourse() ? (
                    <div className="text-center mb-3">
                      <Badge bg="info">Reference Course</Badge>
                      <p className="mt-2">This is a reference course with no assignments</p>
                    </div>
                  ) : (
                    <>
                      <ProgressBar 
                        now={calculateProgress()} 
                        label={`${calculateProgress()}%`}
                        className="mb-3"
                      />
                      <div className="progress-stats">
                        <div className="stat-item">
                          <FaClipboardList className="stat-icon" />
                          <div>
                            <h6>Assignments</h6>
                            <p>{history?.assignments?.length || 0} / {assignments.length}</p>
                          </div>
                        </div>
                        <div className="stat-item">
                          <FaTrophy className="stat-icon" />
                          <div>
                            <h6>Average Score</h6>
                            <p>{(() => {
                              if (!assignments.length || !history?.assignments?.length) return '0%';
                              let totalPoints = 0;
                              let totalScored = 0;
                              assignments.forEach(assignment => {
                                const attempt = history.assignments.find(a => (a.assignment === assignment._id || a.assignment?._id === assignment._id));
                                if (attempt) {
                                  const maxPoints = assignment.totalPoints || 1;
                                  totalPoints += maxPoints;
                                  totalScored += attempt.score || 0;
                                }
                              });
                              if (!totalPoints) return '0%';
                              return `${Math.round((totalScored / totalPoints) * 100)}%`;
                            })()}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="mt-4">
        <Row>
          <Col md={3}>
            <div className="course-sidebar">
              <Nav variant="pills" className="flex-column course-nav" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Nav.Item>
                  <Nav.Link eventKey="overview">
                    <FaBook className="me-2" /> Course Overview
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="assignments">
                    <FaClipboardList className="me-2" /> Assignments
                    <Badge bg="primary" className="float-end">{assignments.length}</Badge>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="materials">
                    <FaFileAlt className="me-2" /> Course Materials
                    <Badge bg="primary" className="float-end">{course.materials?.length || 0}</Badge>
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Card className="instructor-card mt-4">
                <Card.Body>
                  <h5 className="mb-3">Instructor</h5>
                  <div className="instructor-info">
                    <FaUser className="instructor-avatar" />
                    <div>
                      <h6>{course.instructor?.name || 'Unknown Instructor'}</h6>
                      <p className="text-muted mb-0">{course.instructor?.title || 'Course Instructor'}</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </Col>

          <Col md={9}>
            <Card className="main-content-card">
              <Card.Body style={{ padding: '2rem', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <Tab.Content>
                  <Tab.Pane active={activeTab === 'overview'}>
                    <Card className="content-card">
                      <Card.Body>
                        <h3 className="section-title">About This Course</h3>
                        <p className="detailed-description">
                          {course.detailedDescription || 'No detailed description available.'}
                        </p>

                        <h4 className="mt-4 mb-3">What You'll Learn</h4>
                        <Row className="learning-objectives">
                          {course.learningObjectives?.map((objective, index) => (
                            <Col md={6} key={index} className="mb-3">
                              <div className="objective-item">
                                <FaCheckCircle className="objective-icon" />
                                <span>{objective}</span>
                              </div>
                            </Col>
                          ))}
                          {(!course.learningObjectives || course.learningObjectives.length === 0) && (
                            <Col>
                              <Alert variant="info">No learning objectives specified yet.</Alert>
                            </Col>
                          )}
                        </Row>

                        <h4 className="mt-4 mb-3">Course Timeline</h4>
                        <div className="course-timeline">
                          <div className="timeline-item">
                            <FaCalendarCheck className="timeline-icon" />
                            <div>
                              <h6>Course Start</h6>
                              <p>{new Date(course.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="timeline-item">
                            <FaClock className="timeline-icon" />
                            <div>
                              <h6>Duration</h6>
                              <p>{course.duration || 'Flexible'} weeks</p>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>

                  <Tab.Pane active={activeTab === 'assignments'}>
                    <Card className="content-card">
                      <Card.Body>
                    <div className="assignments-grid">
                      {assignments.length > 0 ? (
                        assignments.map((assignment) => {
                          const attempt = history?.assignments?.find(a => a.assignment === assignment._id || a.assignment?._id === assignment._id);
                          return (
                            <Card key={assignment._id} className="assignment-card">
                              <Card.Body>
                                <div className="assignment-status">
                                  {attempt ? (
                                    <Badge bg="success">Completed</Badge>
                                  ) : (
                                    <Badge bg="warning">Pending</Badge>
                                  )}
                                </div>
                                <div className="assignment-type-badge">
                                  <Badge bg="info">
                                    {assignment.type === 'quiz' ? 'Quiz' : 'Assignment'}
                                  </Badge>
                                </div>
                                <h5 className="assignment-title">{assignment.title}</h5>
                                <p className="assignment-description">{assignment.description}</p>
                                <div className="assignment-details">
                                  <div className="detail-item">
                                    <FaCalendarAlt className="detail-icon" />
                                    <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}</span>
                                  </div>
                                  <div className="detail-item">
                                    <FaClock className="detail-icon" />
                                    <span>Duration: {assignment.duration || 'No time limit'}</span>
                                  </div>
                                  <div className="detail-item">
                                    <FaStar className="detail-icon" />
                                    <span>Points: {assignment.totalPoints || 'N/A'}</span>
                                  </div>
                                  {attempt && (
                                    <div className="detail-item">
                                      <FaTrophy className="detail-icon" />
                                      <span>Your Score: {attempt.score}%</span>
                                    </div>
                                  )}
                                </div>
                                <div className="assignment-actions">
                                  {!attempt ? (
                                    <Button
                                      variant="primary"
                                      size="lg"
                                      className="start-btn"
                                      onClick={() => handleStartAssignment(assignment._id)}
                                    >
                                      <FaPlayCircle className="me-2" />
                                      Start {assignment.type === 'quiz' ? 'Quiz' : 'Assignment'}
                                    </Button>
                                  ) : (
                                    <div className="completed-actions">
                                      <Button
                                        variant="outline-primary"
                                        onClick={() => handleStartAssignment(assignment._id)}
                                      >
                                        View Attempt
                                      </Button>
                                      {assignment.allowMultipleAttempts && (
                                        <Button
                                          variant="primary"
                                          onClick={() => handleStartAssignment(assignment._id)}
                                          className="ms-2"
                                        >
                                          Try Again
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </Card.Body>
                            </Card>
                          );
                        })
                      ) : (
                        <Alert variant="info" className="w-100">
                          <Alert.Heading>No Assignments or Quizzes Yet</Alert.Heading>
                          <p>There are no assignments or quizzes available for this course yet. Check back later!</p>
                        </Alert>
                      )}
                    </div>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>

                  <Tab.Pane active={activeTab === 'materials'}>
                    <Card className="content-card">
                      <Card.Body>
                        <h3 className="section-title">Course Materials</h3>
                        <div className="materials-grid">
                          {course.materials?.length > 0 ? (
                            course.materials.map((material, index) => (
                              <Card key={index} className="material-card">
                                <Card.Body>
                                  <div className="material-icon">
                                    {material.type === 'video' ? (
                                      <FaPlayCircle className="material-type-icon video" />
                                    ) : (
                                      <FaFileAlt className="material-type-icon pdf" />
                                    )}
                                  </div>
                                  <h5 className="material-title">{material.title}</h5>
                                  <p className="material-info">
                                    {material.type === 'video' ? 'Video Lecture' : 'PDF Document'}
                                  </p>
                                  <div className="material-meta">
                                    <small>Uploaded: {new Date(material.uploadDate).toLocaleDateString()}</small>
                                  </div>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="material-download-btn"
                                    onClick={() => {
                                      const token = localStorage.getItem('token');
                                      const url = `http://localhost:5000/api/courses/${courseId}/materials/${material._id}/download`;
                                      const xhr = new XMLHttpRequest();
                                      xhr.open('GET', url, true);
                                      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                                      xhr.responseType = 'blob';
                                      xhr.onload = function() {
                                        if (xhr.status === 200) {
                                          const blob = xhr.response;
                                          const link = document.createElement('a');
                                          link.href = window.URL.createObjectURL(blob);
                                          link.download = material.title + material.fileUrl.substring(material.fileUrl.lastIndexOf('.'));
                                          link.click();
                                        } else {
                                          alert('Download failed. Please try again.');
                                        }
                                      };
                                      xhr.send();
                                    }}
                                  >
                                      <FaDownload className="me-2" />
                                      Download
                                    </Button>
                                </Card.Body>
                              </Card>
                            ))
                          ) : (
                            <Alert variant="info" className="w-100">
                              <Alert.Heading>No Materials Yet</Alert.Heading>
                              <p>There are no course materials available yet. Check back later!</p>
                            </Alert>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Add Chatbot component */}
      <Chatbot />
    </Container>
  );
};

export default CourseDetail; 