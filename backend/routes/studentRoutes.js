const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  enrollInCourse,
  getEnrolledCourses,
  getStudentAssignments,
  submitAssignment
} = require('../controllers/studentController');

// Course enrollment routes
router.post('/courses/:courseId/enroll', auth, enrollInCourse);
router.get('/courses/enrolled', auth, getEnrolledCourses);

// Assignment routes
router.get('/assignments/student', auth, getStudentAssignments);
router.post('/assignments/:assignmentId/submit', auth, submitAssignment);

// Get enrolled courses
router.get('/courses', auth, getEnrolledCourses);

// Get student assignments
router.get('/assignments', auth, getStudentAssignments);

module.exports = router; 