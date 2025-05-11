import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, ProgressBar, Alert, Modal } from 'react-bootstrap';
import { FaFilePdf, FaVideo, FaTrash, FaCalendarAlt, FaPlay, FaPlus, FaEdit } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './InstructorPage.css';

const InstructorPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('start-course');
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    template: 'basic' // Default template
  });
  const [material, setMaterial] = useState({
    title: '',
    type: 'pdf',
    file: null,
    courseId: ''
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
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [activeClasses, setActiveClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: '',
    questions: [{
      questionText: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      points: 1
    }]
  });
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);

  const checkUpcomingClasses = useCallback(() => {
    const now = new Date();
    const upcoming = [];
    const active = [];

    courses.forEach(course => {
      course.liveClasses?.forEach(liveClass => {
        const classDateTime = new Date(`${liveClass.date}T${liveClass.time}`);
        const timeDiff = classDateTime - now;
        const minutesUntilStart = Math.floor(timeDiff / (1000 * 60));

        if (minutesUntilStart <= 0 && minutesUntilStart > -liveClass.duration) {
          // Class is currently active
          active.push({ ...liveClass, courseId: course._id });
        } else if (minutesUntilStart > 0 && minutesUntilStart <= 15) {
          // Class is starting within 15 minutes
          upcoming.push({ ...liveClass, courseId: course._id, minutesUntilStart });
        }
      });
    });

    setUpcomingClasses(upcoming);
    setActiveClasses(active);
  }, [courses]);

  const fetchAssignments = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view assignments');
      return;
    }

    try {
      console.log('Fetching assignments...');
      const response = await axios.get('http://localhost:5000/api/assignments/instructor', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data) {
        console.log('Assignments fetched successfully:', response.data);
        setAssignments(response.data);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.msg || 'Error fetching assignments');
      }
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchCourses();
    fetchAssignments();
    // Set up interval to check for upcoming classes
    const interval = setInterval(checkUpcomingClasses, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/courses/instructor', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setCourses(response.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        setError('Failed to fetch courses');
      }
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newCourse.title,
          description: newCourse.description,
          template: newCourse.template
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create course');
      }

      setSuccess('Course created successfully!');
      setNewCourse({ title: '', description: '', template: 'basic' });
      
      // Immediately navigate to the course management page
      navigate(`/instructor/course/${data._id}`, { 
        state: { 
          course: data,
          message: 'Course created successfully! Now you can add live classes and course materials.' 
        } 
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLiveClassSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/courses/live-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...liveClass,
          courseId: material.courseId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to schedule live class');
      }

      setSuccess('Live class scheduled successfully!');
      setShowLiveClassModal(false);
      setLiveClass({
        title: '',
        date: '',
        time: '',
        duration: '60',
        meetingLink: ''
      });
      fetchCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate course selection
    if (!material.courseId) {
      setError('Please select a course');
      return;
    }

    // Validate file upload
    if (!material.file) {
      setError('Please select a file to upload');
      return;
    }

    // Validate material title
    if (!material.title.trim()) {
      setError('Please enter a title for the material');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', material.title);
      formData.append('type', material.type);
      formData.append('file', material.file);
      formData.append('courseId', material.courseId);

      await axios.post(`http://localhost:5000/api/courses/${material.courseId}/materials`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setSuccess('Material uploaded successfully!');
      setMaterial({
        title: '',
        type: 'pdf',
        file: null,
        courseId: material.courseId // Keep the same course selected
      });
      setUploadProgress(0);
      fetchCourses();
    } catch (err) {
      console.error('Error uploading material:', err);
      setError(err.response?.data?.msg || 'Failed to upload material');
    }
  };

  const handleDeleteMaterial = async (courseId, materialId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/${courseId}/materials/${materialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Material deleted successfully');
      fetchCourses();
    } catch (err) {
      setError('Failed to delete material');
    }
  };

  const handleDeleteLiveClass = async (courseId, classId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/${courseId}/live-class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Live class deleted successfully');
      fetchCourses();
    } catch (err) {
      setError('Failed to delete live class');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Course deleted successfully');
      fetchCourses();
    } catch (err) {
      setError('Failed to delete course');
    }
  };

  const startLiveClass = async (courseId, classId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/live-class/${classId}/start`,
        {},
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.msg) {
        setSuccess(response.data.msg);
      } else {
        setSuccess('Live class started successfully');
      }
      
      // Update the local state
      const updatedCourses = courses.map(course => {
        if (course._id === courseId) {
          const updatedLiveClasses = course.liveClasses.map(liveClass => {
            if (liveClass._id === classId) {
              return {
                ...liveClass,
                status: 'active',
                startedAt: new Date()
              };
            }
            return liveClass;
          });
          return { ...course, liveClasses: updatedLiveClasses };
        }
        return course;
      });
      
      setCourses(updatedCourses);
      checkUpcomingClasses(); // Refresh the upcoming/active classes list
    } catch (err) {
      console.error('Error starting live class:', err);
      if (err.response && err.response.data && err.response.data.msg) {
        setError(err.response.data.msg);
      } else {
        setError('Failed to start live class');
      }
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      // Validate the assignment data
      if (!currentAssignment.title.trim()) {
        setError('Please provide a title for the assignment');
        return;
      }
      if (!currentAssignment.description.trim()) {
        setError('Please provide a description for the assignment');
        return;
      }
      if (!currentAssignment.courseId) {
        setError('Please select a course for the assignment');
        return;
      }
      if (!currentAssignment.dueDate) {
        setError('Please set a due date for the assignment');
        return;
      }

      // Validate due date is in the future
      const selectedDate = new Date(currentAssignment.dueDate);
      const now = new Date();
      // Add a 1-minute buffer to ensure the date is in the future
      if (selectedDate <= new Date(now.getTime() + 60000)) {
        setError('Due date must be at least 1 minute in the future');
        return;
      }

      if (!currentAssignment.questions || currentAssignment.questions.length === 0) {
        setError('Please add at least one question to the assignment');
        return;
      }

      // Validate each question
      for (let i = 0; i < currentAssignment.questions.length; i++) {
        const question = currentAssignment.questions[i];
        if (!question.questionText.trim()) {
          setError(`Please provide text for question ${i + 1}`);
          return;
        }
        if (!question.options || question.options.length === 0) {
          setError(`Please add options for question ${i + 1}`);
          return;
        }
        if (!question.options.some(opt => opt.isCorrect)) {
          setError(`Please mark a correct answer for question ${i + 1}`);
          return;
        }
      }

      // Prepare the assignment data
      const assignmentData = {
        title: currentAssignment.title.trim(),
        description: currentAssignment.description.trim(),
        course: currentAssignment.courseId,
        questions: currentAssignment.questions.map(q => ({
          questionText: q.questionText.trim(),
          options: q.options.map(opt => ({
            text: opt.text.trim(),
            isCorrect: opt.isCorrect
          })),
          points: q.points || 1
        })),
        dueDate: selectedDate.toISOString() // Use the validated date
      };

      console.log('Sending assignment data:', assignmentData);

      // Send the assignment data to the backend
      const response = await fetch('http://localhost:5000/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assignmentData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Assignment creation failed:', data);
        if (data.errors) {
          throw new Error(data.errors.join(', '));
        }
        throw new Error(data.msg || 'Failed to create assignment');
      }

      setSuccess('Assignment created successfully!');
      setShowAssignmentModal(false);
      setCurrentAssignment({
        title: '',
        description: '',
        courseId: '',
        dueDate: '',
        questions: [{
          questionText: '',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ],
          points: 1
        }]
      });
      fetchAssignments(); // Refresh the assignments list
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err.message || 'Failed to create assignment');
    }
  };

  const addQuestion = () => {
    setCurrentAssignment(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ],
          points: 1
        }
      ]
    }));
  };

  const updateQuestion = (index, field, value) => {
    setCurrentAssignment(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return { ...prev, questions: newQuestions };
    });
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    setCurrentAssignment(prev => {
      const newQuestions = [...prev.questions];
      const newOptions = [...newQuestions[questionIndex].options];
      newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
      newQuestions[questionIndex].options = newOptions;
      return { ...prev, questions: newQuestions };
    });
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to delete assignments');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to delete assignment');
      }

      // Update the assignments list
      setAssignments(prevAssignments => 
        prevAssignments.filter(assignment => assignment._id !== assignmentId)
      );
      setSuccess('Assignment deleted successfully');
      
      // Close the confirmation modal
      setShowDeleteConfirm(false);
      setAssignmentToDelete(null);
    } catch (err) {
      console.error('Error deleting assignment:', err);
      setError(err.message || 'Failed to delete assignment');
      // Close the confirmation modal even if there's an error
      setShowDeleteConfirm(false);
      setAssignmentToDelete(null);
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setCurrentAssignment({
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.course,
      dueDate: new Date(assignment.dueDate).toISOString().split('T')[0],
      questions: assignment.questions
    });
    setShowEditAssignmentModal(true);
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/assignments/${editingAssignment._id}`,
        {
          title: currentAssignment.title,
          description: currentAssignment.description,
          course: currentAssignment.courseId,
          questions: currentAssignment.questions,
          dueDate: currentAssignment.dueDate
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        setSuccess('Assignment updated successfully');
        setShowEditAssignmentModal(false);
        setEditingAssignment(null);
        setCurrentAssignment({
          title: '',
          description: '',
          courseId: '',
          dueDate: '',
          questions: [{
            questionText: '',
            options: [
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
              { text: '', isCorrect: false }
            ],
            points: 1
          }]
        });
        fetchAssignments();
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      setError(err.response?.data?.msg || 'Failed to update assignment');
    }
  };

  return (
    <Container fluid className="instructor-dashboard">
      <Row>
        {/* Course Management Section */}
        <Col md={12} className="course-section">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Tab Navigation */}
          <div className="tabs mb-4">
            <button
              className={`tab-button ${activeTab === 'start-course' ? 'active' : ''}`}
              onClick={() => setActiveTab('start-course')}
            >
              Start Course
            </button>
            <button
              className={`tab-button ${activeTab === 'my-courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-courses')}
            >
              My Courses
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'start-course' && (
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Create New Course</Card.Title>
                <Form onSubmit={handleCourseSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Course Title</Form.Label>
                    <Form.Control
                      type="text"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                      placeholder="e.g., Introduction to Web Development"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      placeholder="Brief description of the course"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Course Template</Form.Label>
                    <Form.Select
                      value={newCourse.template}
                      onChange={(e) => setNewCourse({ ...newCourse, template: e.target.value })}
                    >
                      <option value="basic">Basic Course</option>
                      <option value="advanced">Advanced Course</option>
                      <option value="workshop">Workshop</option>
                    </Form.Select>
                  </Form.Group>

                  <Button type="submit" variant="primary">
                    Create Course
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          )}

          {activeTab === 'my-courses' && (
            <div>
              {/* Live Class and Material Upload Section */}
              <Card className="mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <Card.Title>Course Management</Card.Title>
                    <Button
                      variant="primary"
                      onClick={() => setShowLiveClassModal(true)}
                    >
                      <FaCalendarAlt className="me-2" />
                      Schedule Live Class
                    </Button>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Select Course</Form.Label>
                    <Form.Select
                      value={material.courseId}
                      onChange={(e) => setMaterial({ ...material, courseId: e.target.value })}
                    >
                      <option value="">Choose a course...</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form onSubmit={handleMaterialSubmit}>
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
                      <div className="file-upload-container">
                        <Form.Control
                          type="file"
                          accept={material.type === 'pdf' ? '.pdf' : 'video/*'}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (material.type === 'pdf' && !file.type.includes('pdf')) {
                                setError('Please upload a PDF file');
                                return;
                              }
                              if (material.type === 'video' && !file.type.includes('video')) {
                                setError('Please upload a video file');
                                return;
                              }
                              setMaterial(prevMaterial => ({
                                ...prevMaterial,
                                file: file
                              }));
                              setError('');
                            }
                          }}
                          required
                        />
                        {material.file && (
                          <div className="selected-file mt-2">
                            <p>Selected file: {material.file.name}</p>
                            <p>Size: {(material.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        )}
                      </div>
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
                </Card.Body>
              </Card>

              {/* Course List */}
              <Card>
                <Card.Body>
                  <Card.Title>Your Courses</Card.Title>
                  {courses.map((course) => (
                    <Card key={course._id} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <Card.Title>{course.title}</Card.Title>
                            <Card.Text>{course.description}</Card.Text>
                          </div>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setCourseToDelete(course);
                              setShowDeleteModal(true);
                            }}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                        
                        {/* Live Classes */}
                        <div className="live-classes-section">
                          <h5>Live Classes</h5>
                          <div className="live-classes-list">
                            {course.liveClasses?.map((liveClass) => (
                              <div key={liveClass._id} className="live-class-item">
                                <div>
                                  <strong>{liveClass.title}</strong>
                                  <div>Date: {new Date(liveClass.date).toLocaleDateString()}</div>
                                  <div>Time: {liveClass.time}</div>
                                  <div>Duration: {liveClass.duration} minutes</div>
                                  <div className="d-flex gap-2 mt-2">
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => window.open(liveClass.meetingLink, '_blank')}
                                      disabled={!isClassActive(liveClass)}
                                    >
                                      <FaPlay className="me-2" />
                                      {isClassActive(liveClass) ? 'Join Class' : 'Not Started'}
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleDeleteLiveClass(course._id, liveClass._id)}
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Course Materials */}
                        <div className="materials-section">
                          <h5>Course Materials</h5>
                          <div className="materials-list">
                            {course.materials?.map((material) => (
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
                                    onClick={() => handleDeleteMaterial(course._id, material._id)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Assignments Section */}
                        <div className="assignments-section mt-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>Assignments</h5>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setCurrentAssignment({ ...currentAssignment, course: course._id });
                                setShowAssignmentModal(true);
                              }}
                            >
                              <FaPlus className="me-2" />
                              Add Assignment
                            </Button>
                          </div>
                          <div className="assignments-list">
                            {assignments
                              .filter(assignment => assignment.course._id === course._id)
                              .map(assignment => (
                                <Card key={assignment._id} className="mb-3">
                                  <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                      <div>
                                        <Card.Title>{assignment.title}</Card.Title>
                                        <Card.Text>{assignment.description}</Card.Text>
                                        <div>Due Date: {new Date(assignment.dueDate).toLocaleDateString()}</div>
                                        <div>Total Points: {assignment.totalPoints}</div>
                                      </div>
                                      <div className="d-flex gap-2">
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          onClick={() => handleEditAssignment(assignment)}
                                        >
                                          <FaEdit />
                                        </Button>
                                        <Button
                                          variant="danger"
                                          size="sm"
                                          onClick={() => {
                                            setAssignmentToDelete(assignment._id);
                                            setShowDeleteConfirm(true);
                                          }}
                                        >
                                          <FaTrash />
                                        </Button>
                                      </div>
                                    </div>
                                  </Card.Body>
                                </Card>
                              ))}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </Card.Body>
              </Card>
            </div>
          )}
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

      {/* Delete Course Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the course "{courseToDelete?.title}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              handleDeleteCourse(courseToDelete?._id);
              setShowDeleteModal(false);
            }}
          >
            Delete Course
          </Button>
        </Modal.Footer>
      </Modal>

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
                onClick={() => startLiveClass(liveClass.courseId, liveClass._id)}
              >
                <FaPlay className="me-2" />
                Start Now
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
                onClick={() => window.open(liveClass.meetingLink, '_blank')}
              >
                <FaPlay className="me-2" />
                Join Class
              </Button>
            </div>
          ))}
        </Alert>
      )}

      {/* Assignment Creation Modal */}
      <Modal show={showAssignmentModal} onHide={() => setShowAssignmentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAssignmentSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Course</Form.Label>
              <Form.Select
                value={currentAssignment.courseId}
                onChange={(e) => setCurrentAssignment(prev => ({ ...prev, courseId: e.target.value }))}
                required
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={currentAssignment.title}
                onChange={(e) => setCurrentAssignment(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={currentAssignment.description}
                onChange={(e) => setCurrentAssignment(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="datetime-local"
                value={currentAssignment.dueDate}
                onChange={(e) => setCurrentAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </Form.Group>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5>Questions</h5>
                <Button variant="outline-primary" size="sm" onClick={addQuestion}>
                  <FaPlus className="me-2" />
                  Add Question
                </Button>
              </div>

              {currentAssignment.questions.map((question, qIndex) => (
                <Card key={qIndex} className="mb-3">
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Question {qIndex + 1}</Form.Label>
                      <Form.Control
                        type="text"
                        value={question.questionText}
                        onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Points</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                        required
                      />
                    </Form.Group>

                    <h6>Options</h6>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="d-flex align-items-center mb-2">
                        <Form.Check
                          type="radio"
                          name={`question-${qIndex}`}
                          checked={option.isCorrect}
                          onChange={() => {
                            const newOptions = question.options.map((opt, idx) => ({
                              ...opt,
                              isCorrect: idx === oIndex
                            }));
                            updateQuestion(qIndex, 'options', newOptions);
                          }}
                          className="me-2"
                        />
                        <Form.Control
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              ))}
            </div>

            <Button type="submit" variant="primary">
              Create Assignment
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal show={showEditAssignmentModal} onHide={() => setShowEditAssignmentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateAssignment}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={currentAssignment.title}
                onChange={(e) => setCurrentAssignment(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={currentAssignment.description}
                onChange={(e) => setCurrentAssignment(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Due Date</Form.Label>
              <Form.Control
                type="date"
                value={currentAssignment.dueDate}
                onChange={(e) => setCurrentAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </Form.Group>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5>Questions</h5>
                <Button variant="outline-primary" size="sm" onClick={addQuestion}>
                  <FaPlus className="me-2" />
                  Add Question
                </Button>
              </div>

              {currentAssignment.questions.map((question, qIndex) => (
                <Card key={qIndex} className="mb-3">
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Question {qIndex + 1}</Form.Label>
                      <Form.Control
                        type="text"
                        value={question.questionText}
                        onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Points</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                        required
                      />
                    </Form.Group>

                    <h6>Options</h6>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="d-flex align-items-center mb-2">
                        <Form.Check
                          type="radio"
                          name={`question-${qIndex}`}
                          checked={option.isCorrect}
                          onChange={() => {
                            const newOptions = question.options.map((opt, idx) => ({
                              ...opt,
                              isCorrect: idx === oIndex
                            }));
                            updateQuestion(qIndex, 'options', newOptions);
                          }}
                          className="me-2"
                        />
                        <Form.Control
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              ))}
            </div>

            <Button type="submit" variant="primary">
              Update Assignment
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => {
        setShowDeleteConfirm(false);
        setAssignmentToDelete(null);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this assignment? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowDeleteConfirm(false);
            setAssignmentToDelete(null);
          }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleDeleteAssignment(assignmentToDelete)}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

// Helper function to check if a class is active
const isClassActive = (liveClass) => {
  const now = new Date();
  const classDateTime = new Date(`${liveClass.date}T${liveClass.time}`);
  const timeDiff = classDateTime - now;
  const minutesUntilStart = Math.floor(timeDiff / (1000 * 60));
  return minutesUntilStart <= 0 && minutesUntilStart > -liveClass.duration;
};

export default InstructorPage; 