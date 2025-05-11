const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const CourseHistory = require('../models/CourseHistory');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const assignmentController = require('../controllers/assignmentController');


router.post('/', auth, checkRole('instructor'), assignmentController.createAssignment);

router.get('/course/:courseId', auth, assignmentController.getCourseAssignments);


router.get('/instructor', auth, checkRole('instructor'), async (req, res) => {
  try {
    const assignments = await Assignment.find({ instructor: req.user._id })
      .populate('course', 'title')
      .populate('instructor', 'name')
      .sort({ createdAt: -1 });
    
    res.json(assignments);
  } catch (err) {
    console.error('Error fetching instructor assignments:', err);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Get a single assignment
router.get('/:id', auth, assignmentController.getAssignment);

// Update an assignment
router.put('/:id', auth, checkRole('instructor'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }

    if (assignment.instructor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { title, description, questions, dueDate } = req.body;
    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.questions = questions || assignment.questions;
    assignment.dueDate = dueDate || assignment.dueDate;

    await assignment.save();
    res.json(assignment);
  } catch (err) {
    console.error('Error updating assignment:', err);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Delete an assignment
router.delete('/:id', auth, checkRole('instructor'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }

    // Check if the user is the instructor of this assignment
    if (assignment.instructor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized to delete this assignment' });
    }

    await assignment.deleteOne();
    res.json({ msg: 'Assignment deleted successfully' });
  } catch (err) {
    console.error('Error deleting assignment:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Student attempts an assignment
router.post('/:assignmentId/attempt', auth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ msg: 'Assignment not found' });

    // Calculate score
    let score = 0;
    assignment.questions.forEach(q => {
      const selected = answers[q._id] || answers[q._id.toString()];
      const correct = q.options.find(opt => opt.isCorrect);
      if (selected && correct && selected === correct.text) score += q.points;
    });

    // Find the course for this assignment
    const course = await Course.findById(assignment.course);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    // Upsert course history for this student and course
    let history = await CourseHistory.findOne({ student: userId, course: course._id });
    if (!history) {
      history = new CourseHistory({ student: userId, course: course._id, assignments: [] });
    }
    // Remove previous attempt for this assignment if exists
    history.assignments = history.assignments.filter(a => a.assignment.toString() !== assignmentId);
    // Add new attempt
    history.assignments.push({
      assignment: assignment._id,
      attemptedAt: new Date(),
      answers: Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption })),
      score
    });
    await history.save();

    res.json({ msg: 'Assignment submitted', score });
  } catch (err) {
    console.error('Error submitting assignment attempt:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router; 