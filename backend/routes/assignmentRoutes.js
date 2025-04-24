const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const auth = require('../middleware/auth');
const assignmentController = require('../controllers/assignmentController');


router.post('/', auth, assignmentController.createAssignment);

router.get('/course/:courseId', auth, assignmentController.getCourseAssignments);


router.get('/instructor', auth, async (req, res) => {
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
router.put('/:id', auth, async (req, res) => {
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
router.delete('/:id', auth, async (req, res) => {
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

module.exports = router; 