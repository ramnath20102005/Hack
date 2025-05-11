import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Modal, ProgressBar, Badge } from 'react-bootstrap';
import { FaUser, FaEdit, FaSave, FaTimes, FaCode, FaStar, FaTrophy, FaBook, FaClipboardList, FaCheckCircle, FaEnvelope, FaPhone, FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../assets/default-avatar.png';
import Chatbot from '../components/Chatbot';
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
    profileImage: null,
    email: '',
    phone: '',
    education: '',
    role: ''
  });
  const [editForm, setEditForm] = useState({ ...profileData });
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseHistory, setCourseHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [instructorCourses, setInstructorCourses] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedInstructorCourse, setSelectedInstructorCourse] = useState(null);
  const [modalAssignments, setModalAssignments] = useState([]);
  const [studentAssignments, setStudentAssignments] = useState([]);
  const [progressModal, setProgressModal] = useState({ show: false, course: null, assignments: [] });
  const [progressData, setProgressData] = useState(null);
  const userRole = localStorage.getItem('userRole');

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

    const fetchEnrolledCourses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/student/courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setEnrolledCourses(data);
        }
      } catch (err) {
        console.error('Error fetching enrolled courses:', err);
      }
    };

    const fetchInstructorCourses = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/courses/instructor', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setInstructorCourses(data);
        }
      } catch (error) {
        console.error('Error fetching instructor courses:', error);
      }
    };

    const fetchAssignments = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/student/assignments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStudentAssignments(data);
        }
      } catch (err) {
        console.error('Error fetching student assignments:', err);
      }
    };

    fetchProfileData();
    if (userRole === 'student') fetchEnrolledCourses();
    if (userRole === 'instructor') fetchInstructorCourses();
    fetchAssignments();
  }, [navigate, userRole]);

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

  const handleShowHistory = async (course) => {
    setSelectedCourse(course);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    setModalAssignments([]);
    setCourseHistory(null);
    try {
      const token = localStorage.getItem('token');
      const courseId = String(course._id);
      const [assignmentsRes, historyRes] = await Promise.all([
        fetch(`http://localhost:5000/api/assignments/course/${courseId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/courses/${courseId}/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      let assignments = [];
      if (assignmentsRes.ok) {
        assignments = await assignmentsRes.json();
      }
      setModalAssignments(assignments || []);
      let history = null;
      if (historyRes.ok) {
        history = await historyRes.json();
      }
      setCourseHistory(history && Array.isArray(history.assignments) ? history : { assignments: [] });
    } catch (error) {
      setModalAssignments([]);
      setCourseHistory({ assignments: [] });
    } finally {
      setLoadingHistory(false);
    }
  };

  const calculateModalProgress = () => {
    if (!modalAssignments || modalAssignments.length === 0) return 100; // Reference course
    if (!courseHistory?.assignments?.length) return 0;
    const completed = modalAssignments.filter(assignment =>
      courseHistory.assignments.some(a =>
        String(a.assignment) === String(assignment._id) ||
        String(a.assignment?._id) === String(assignment._id)
      )
    ).length;
    return Math.round((completed / modalAssignments.length) * 100);
  };

  const handleViewProgress = (course) => {
    const courseAssignments = studentAssignments.filter(a => {
      // a.course can be an object or string
      if (!a.course) return false;
      if (typeof a.course === 'string') return a.course === course._id;
      return a.course._id === course._id;
    });
    setProgressModal({ show: true, course, assignments: courseAssignments });
  };

  return (
    <div className="page-container py-5">
      <Container fluid>
        <Row className="justify-content-center">
          <Col md={4}>
            <Card className="profile-card shadow-sm">
              <Card.Body className="p-4">
                <div className="profile-header text-center">
                  <img
                    src={profileData.profileImage || defaultAvatar}
                    alt="Profile"
                    style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, border: '2px solid #eee' }}
                  />
                  <h3>{profileData.name}</h3>
                  <p className="text-muted">{profileData.role === 'student' ? 'Student' : 'Instructor'}</p>
                </div>
                {!isEditing ? (
                  <div className="profile-info">
                    <p><FaEnvelope className="me-2" /> {profileData.email}</p>
                    <p><FaPhone className="me-2" /> {profileData.phone || 'Not provided'}</p>
                    {profileData.role === 'student' ? (
                      <>
                        <p><FaGraduationCap className="me-2" /> {profileData.education || 'Not provided'}</p>
                        <p>Year: {profileData.year || 'Not provided'}</p>
                        <p>Major: {profileData.major || 'Not provided'}</p>
                      </>
                    ) : (
                      <>
                        <p>Department: {profileData.department || 'Not provided'}</p>
                        <p>Expertise: {(profileData.expertise && profileData.expertise.length > 0) ? profileData.expertise.join(', ') : 'Not provided'}</p>
                        <p>Office: {profileData.office || 'Not provided'}</p>
                      </>
                    )}
                    <Button variant="primary" onClick={handleEdit} className="mt-3">
                      <FaEdit className="me-2" /> Edit Profile
                    </Button>
                  </div>
                ) : (
                  <Form onSubmit={handleSave}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </Form.Group>
                    {profileData.role === 'student' ? (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Education</Form.Label>
                          <Form.Control
                            type="text"
                            name="education"
                            value={editForm.education}
                            onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Year</Form.Label>
                          <Form.Control
                            type="text"
                            name="year"
                            value={editForm.year}
                            onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Major</Form.Label>
                          <Form.Control
                            type="text"
                            name="major"
                            value={editForm.major}
                            onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
                          />
                        </Form.Group>
                      </>
                    ) : (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Department</Form.Label>
                          <Form.Control
                            type="text"
                            name="department"
                            value={editForm.department}
                            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Expertise</Form.Label>
                          <Form.Control
                            type="text"
                            name="expertise"
                            value={Array.isArray(editForm.expertise) ? editForm.expertise.join(', ') : editForm.expertise}
                            onChange={(e) => setEditForm({ ...editForm, expertise: e.target.value })}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Office</Form.Label>
                          <Form.Control
                            type="text"
                            name="office"
                            value={editForm.office}
                            onChange={(e) => setEditForm({ ...editForm, office: e.target.value })}
                          />
                        </Form.Group>
                      </>
                    )}
                    {isEditing && (
                      <Form.Group className="mb-3 text-center">
                        <Form.Label>Profile Image</Form.Label>
                        <div>
                          <img
                            src={editForm.profileImage || defaultAvatar}
                            alt="Profile Preview"
                            style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '2px solid #eee' }}
                          />
                        </div>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ maxWidth: 300, margin: '0 auto' }}
                        />
                      </Form.Group>
                    )}
                    <div className="d-flex gap-2">
                      <Button variant="primary" type="submit">
                        <FaSave className="me-2" /> Save
                      </Button>
                      <Button variant="secondary" onClick={handleCancel}>
                        <FaTimes className="me-2" /> Cancel
                      </Button>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={8}>
            <Card className="enrolled-courses-card">
              <Card.Body>
                {profileData.role === 'instructor' ? (
                  <>
                    <h4 className="mb-4">Your Courses</h4>
                    {instructorCourses.length > 0 ? (
                      <div className="enrolled-courses-list">
                        {instructorCourses.map((course) => (
                          <Card key={course._id} className="course-card mb-3" onClick={() => { setSelectedInstructorCourse(course); setShowCourseModal(true); }} style={{ cursor: 'pointer' }}>
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h5>{course.title}</h5>
                                  <p className="text-muted mb-2">{course.description}</p>
                                  <div className="course-meta">
                                    <span><FaBook className="me-2" /> {course.materials?.length || 0} Materials</span>
                                    <span><FaClipboardList className="me-2" /> {course.assignments?.length || 0} Assignments</span>
                                  </div>
                                </div>
                                <Button variant="outline-primary" onClick={e => { e.stopPropagation(); setSelectedInstructorCourse(course); setShowCourseModal(true); }}>
                                  View Details
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Alert variant="info">You haven't created any courses yet.</Alert>
                    )}
                  </>
                ) : (
                  <>
                    <h4 className="mb-4">Enrolled Courses</h4>
                    {enrolledCourses.length > 0 ? (
                      <div className="enrolled-courses-list">
                        {enrolledCourses.map((course) => (
                          <Card key={course._id} className="course-card mb-3">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h5>{course.title}</h5>
                                  <p className="text-muted mb-2">{course.description}</p>
                                  <div className="course-meta">
                                    <span><FaBook className="me-2" /> {course.materials?.length || 0} Materials</span>
                                    <span><FaClipboardList className="me-2" /> {course.assignments?.length || 0} Assignments</span>
                                  </div>
                                </div>
                                <Button
                                  variant="outline-primary"
                                  onClick={() => {
                                    setSelectedCourse(course);
                                    setShowHistoryModal(true);
                                  }}
                                >
                                  View
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Alert variant="info">
                        You haven't enrolled in any courses yet. Browse our courses to start learning!
                      </Alert>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Course History Modal */}
        {userRole !== 'instructor' && (
          <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg" centered>
            <Modal.Header closeButton>
              <Modal.Title>Course History: {selectedCourse?.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {loadingHistory ? (
                <div className="text-center my-4">
                  <div className="spinner-border text-primary" role="status"></div>
                  <div>Loading course details...</div>
                </div>
              ) : (
                <>
                  <Card className="mb-3 shadow-sm" style={{ borderRadius: '12px', border: 'none' }}>
                    <Card.Body>
                      <h4 className="mb-2">{selectedCourse?.title}</h4>
                      <p className="text-muted mb-2">{selectedCourse?.description}</p>
                      <div className="mb-2">
                        <Badge bg="info" className="me-2">Instructor: {selectedCourse?.instructor?.name || 'N/A'}</Badge>
                        <Badge bg="primary" className="me-2">{selectedCourse?.materials?.length || 0} Materials</Badge>
                        <Badge bg="success">{selectedCourse?.assignments?.length || 0} Assignments</Badge>
                      </div>
                    </Card.Body>
                  </Card>
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setShowHistoryModal(false);
                        navigate(`/course/${selectedCourse._id}`);
                      }}
                    >
                      Go to Course Details
                    </Button>
                  </div>
                </>
              )}
            </Modal.Body>
          </Modal>
        )}

        {/* Instructor Course Details Modal */}
        {profileData.role === 'instructor' && (
          <Modal show={showCourseModal} onHide={() => setShowCourseModal(false)} size="lg" centered>
            <Modal.Header closeButton>
              <Modal.Title>Course Details: {selectedInstructorCourse?.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedInstructorCourse ? (
                <>
                  <h5>Description</h5>
                  <p>{selectedInstructorCourse.description}</p>
                  <h5>Number of Students Enrolled</h5>
                  <p>{selectedInstructorCourse.students ? selectedInstructorCourse.students.length : 0}</p>
                  <h5>Materials</h5>
                  <ul>
                    {selectedInstructorCourse.materials && selectedInstructorCourse.materials.length > 0 ? (
                      selectedInstructorCourse.materials.map((mat, idx) => (
                        <li key={idx}>{mat.title}</li>
                      ))
                    ) : (
                      <li>No materials added yet.</li>
                    )}
                  </ul>
                  <h5>Assignments</h5>
                  <ul>
                    {selectedInstructorCourse.assignments && selectedInstructorCourse.assignments.length > 0 ? (
                      selectedInstructorCourse.assignments.map((assn, idx) => (
                        <li key={idx}>{assn.title || 'Untitled Assignment'}</li>
                      ))
                    ) : (
                      <li>No assignments added yet.</li>
                    )}
                  </ul>
                </>
              ) : (
                <div>Loading...</div>
              )}
            </Modal.Body>
          </Modal>
        )}

        {/* Progress Modal */}
        <Modal show={progressModal.show} onHide={() => setProgressModal({ show: false, course: null, assignments: [] })}>
          <Modal.Header closeButton>
            <Modal.Title>Progress for {progressModal.course?.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {progressModal.assignments.length === 0 ? (
              <Alert variant="info">This is a reference course.</Alert>
            ) : (
              <>
                <ul>
                  {progressModal.assignments.map(a => (
                    <li key={a._id}>
                      {a.title} - {a.submitted ? `Completed${a.score ? ` (Score: ${a.score})` : ''}` : 'Not attempted'}
                    </li>
                  ))}
                </ul>
                <ProgressBar
                  now={progressModal.assignments.filter(a => a.submitted).length / progressModal.assignments.length * 100}
                  label={`${progressModal.assignments.filter(a => a.submitted).length}/${progressModal.assignments.length}`}
                />
              </>
            )}
          </Modal.Body>
        </Modal>

        {/* Add Chatbot component */}
        <Chatbot />
      </Container>
    </div>
  );
};

export default Profile;