import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Modal } from 'react-bootstrap';
import { FaSearch, FaBook, FaCalendarAlt, FaCheck, FaFileAlt, FaPlay } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StudentPage.css';

const StudentPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('enroll');
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [submission, setSubmission] = useState({});
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [activeClasses, setActiveClasses] = useState([]);

  const fetchAvailableCourses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setError('No authentication token found. Please login again.');
        navigate('/login');
        return;
      }

      console.log('Fetching available courses...');
      const response = await axios.get('http://localhost:5000/api/courses/available', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Courses response:', response.data);
      if (Array.isArray(response.data)) {
        setCourses(response.data);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Received invalid data format from server');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        if (err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else if (err.response.data?.error) {
          setError(err.response.data.error);
        } else {
          setError(`Failed to fetch courses: ${err.response.status} ${err.response.statusText}`);
        }
      } else if (err.request) {
        setError('No response received from server. Please check if the server is running.');
      } else {
        setError('Error setting up the request: ' + err.message);
      }
    }
  }, [navigate]);

  const fetchEnrolledCourses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/students/courses/enrolled', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setEnrolledCourses(data);
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
      setError('Failed to fetch enrolled courses');
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/students/assignments/student', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setAssignments(data);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Failed to fetch assignments');
    }
  }, []);

  const checkUpcomingClasses = useCallback(() => {
    const now = new Date();
    const upcoming = [];
    const active = [];

    enrolledCourses.forEach(course => {
      course.liveClasses?.forEach(liveClass => {
        const classDateTime = new Date(`${liveClass.date}T${liveClass.time}`);
        const timeDiff = classDateTime - now;
        const minutesUntilStart = Math.floor(timeDiff / (1000 * 60));

        if (minutesUntilStart <= 0 && minutesUntilStart > -liveClass.duration) {
          active.push({ ...liveClass, courseId: course._id });
        } else if (minutesUntilStart > 0 && minutesUntilStart <= 15) {
          upcoming.push({ ...liveClass, courseId: course._id, minutesUntilStart });
        }
      });
    });

    setUpcomingClasses(upcoming);
    setActiveClasses(active);
  }, [enrolledCourses]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const initializeData = async () => {
      await fetchAvailableCourses();
      await fetchEnrolledCourses();
      await fetchAssignments();
      checkUpcomingClasses();
    };

    initializeData();
  }, [navigate, fetchAvailableCourses, fetchEnrolledCourses, fetchAssignments, checkUpcomingClasses]);

  const handleEnroll = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        navigate('/login');
        return;
      }

      console.log('Enrolling in course:', courseId);
      const response = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/enroll`,
        {},
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Enrollment response:', response.data);
      if (response.data.success) {
        setSuccess('Successfully enrolled in the course!');
        fetchEnrolledCourses(); // Refresh enrolled courses
        fetchAvailableCourses(); // Refresh available courses
      } else {
        setError(response.data.message || 'Failed to enroll in the course');
      }
    } catch (err) {
      console.error('Error enrolling in course:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        if (err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else if (err.response.data?.error) {
          setError(err.response.data.error);
        } else {
          setError(`Failed to enroll: ${err.response.status} ${err.response.statusText}`);
        }
      } else if (err.request) {
        setError('No response received from server. Please check if the server is running.');
      } else {
        setError('Error setting up the request: ' + err.message);
      }
    }
  };

  const handleAssignmentSubmit = async (assignmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/students/assignments/${assignmentId}/submit`,
        {
          answers: submission[assignmentId]
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess('Assignment submitted successfully!');
      setShowAssignmentModal(false);
      fetchAssignments();
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setError(err.response?.data?.msg || 'Failed to submit assignment');
    }
  };

  const joinLiveClass = (meetingLink) => {
    window.open(meetingLink, '_blank');
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container fluid className="student-dashboard">
      <Row>
        <Col md={12}>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Upcoming Classes Alert */}
          {upcomingClasses.length > 0 && (
            <Alert variant="warning" className="mb-4">
              <h5>Upcoming Live Classes</h5>
              {upcomingClasses.map((liveClass, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>{liveClass.title}</strong> - Starting in {liveClass.minutesUntilStart} minutes
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => joinLiveClass(liveClass.meetingLink)}
                  >
                    <FaPlay className="me-2" />
                    Join Class
                  </Button>
                </div>
              ))}
            </Alert>
          )}

          {/* Active Classes Alert */}
          {activeClasses.length > 0 && (
            <Alert variant="success" className="mb-4">
              <h5>Active Live Classes</h5>
              {activeClasses.map((liveClass, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>{liveClass.title}</strong> - In Progress
                  </div>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => joinLiveClass(liveClass.meetingLink)}
                  >
                    <FaPlay className="me-2" />
                    Join Class
                  </Button>
                </div>
              ))}
            </Alert>
          )}

          {/* Tab Navigation */}
          <div className="tabs mb-4">
            <button
              className={`tab-button ${activeTab === 'enroll' ? 'active' : ''}`}
              onClick={() => setActiveTab('enroll')}
            >
              Enroll in Courses
            </button>
            <button
              className={`tab-button ${activeTab === 'my-courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-courses')}
            >
              My Courses
            </button>
            <button
              className={`tab-button ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => setActiveTab('assignments')}
            >
              Assignments
            </button>
          </div>

          {/* Course Search and Enrollment Section */}
          {activeTab === 'enroll' && (
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Available Courses</Card.Title>
                <Form.Group className="mb-3">
                  <div className="search-container">
                    <FaSearch className="search-icon" />
                    <Form.Control
                      type="text"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Form.Group>

                <div className="courses-grid">
                  {filteredCourses.map(course => (
                    <Card key={course._id} className="course-card">
                      <Card.Body>
                        <Card.Title>{course.title}</Card.Title>
                        <Card.Text>{course.description}</Card.Text>
                        <div className="course-meta">
                          <span><FaBook /> {course.materials?.length || 0} Materials</span>
                          <span><FaCalendarAlt /> {course.liveClasses?.length || 0} Live Classes</span>
                        </div>
                        <Button
                          variant="primary"
                          onClick={() => {
                            setSelectedCourse(course);
                            setShowEnrollModal(true);
                          }}
                        >
                          Enroll Now
                        </Button>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* My Courses Section */}
          {activeTab === 'my-courses' && (
            <Card>
              <Card.Body>
                <Card.Title>My Enrolled Courses</Card.Title>
                <div className="courses-grid">
                  {enrolledCourses.map(course => (
                    <Card key={course._id} className="course-card">
                      <Card.Body>
                        <Card.Title>{course.title}</Card.Title>
                        <Card.Text>{course.description}</Card.Text>
                        <div className="course-meta">
                          <span><FaBook /> {course.materials?.length || 0} Materials</span>
                          <span><FaCalendarAlt /> {course.liveClasses?.length || 0} Live Classes</span>
                        </div>
                        <div className="course-actions">
                          <Button
                            variant="primary"
                            onClick={() => navigate(`/course/${course._id}`)}
                          >
                            View Course
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Assignments Section */}
          {activeTab === 'assignments' && (
            <Card>
              <Card.Body>
                <Card.Title>My Assignments</Card.Title>
                <div className="assignments-list">
                  {assignments.map(assignment => (
                    <Card key={assignment._id} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <Card.Title>{assignment.title}</Card.Title>
                            <Card.Text>{assignment.description}</Card.Text>
                            <div className="assignment-meta">
                              <span><FaCalendarAlt /> Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                              <span><FaFileAlt /> {assignment.questions.length} Questions</span>
                            </div>
                          </div>
                          <div className="assignment-status">
                            {assignment.submitted ? (
                              <span className="text-success">
                                <FaCheck /> Submitted
                              </span>
                            ) : (
                              <Button
                                variant="primary"
                                onClick={() => {
                                  setCurrentAssignment(assignment);
                                  setShowAssignmentModal(true);
                                }}
                              >
                                Submit Assignment
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Enroll Modal */}
      <Modal show={showEnrollModal} onHide={() => setShowEnrollModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Enroll in Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCourse && (
            <>
              <h5>{selectedCourse.title}</h5>
              <p>{selectedCourse.description}</p>
              <p>Are you sure you want to enroll in this course?</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleEnroll(selectedCourse._id)}
          >
            Confirm Enrollment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assignment Submission Modal */}
      <Modal show={showAssignmentModal} onHide={() => setShowAssignmentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Submit Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentAssignment && (
            <Form>
              <h5>{currentAssignment.title}</h5>
              <p>{currentAssignment.description}</p>
              
              {currentAssignment.questions.map((question, index) => (
                <Form.Group key={index} className="mb-3">
                  <Form.Label>Question {index + 1}: {question.questionText}</Form.Label>
                  <Form.Select
                    value={submission[currentAssignment._id]?.[index] || ''}
                    onChange={(e) => {
                      setSubmission(prev => ({
                        ...prev,
                        [currentAssignment._id]: {
                          ...prev[currentAssignment._id],
                          [index]: e.target.value
                        }
                      }));
                    }}
                  >
                    <option value="">Select an answer</option>
                    {question.options.map((option, optIndex) => (
                      <option key={optIndex} value={optIndex}>
                        {option.text}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              ))}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignmentModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleAssignmentSubmit(currentAssignment._id)}
          >
            Submit Assignment
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StudentPage; 