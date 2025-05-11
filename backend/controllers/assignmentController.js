const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

// Create a new assignment
exports.createAssignment = async (req, res) => {
  try {
    console.log('Received assignment data:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user._id);
    
    const { title, description, course, questions, dueDate } = req.body;

    // Basic validation
    if (!title || !description || !course || !questions || !dueDate) {
      console.log('Missing required fields:', {
        title: !title,
        description: !description,
        course: !course,
        questions: !questions,
        dueDate: !dueDate
      });
      return res.status(400).json({ 
        msg: 'Missing required fields',
        missing: {
          title: !title,
          description: !description,
          course: !course,
          questions: !questions,
          dueDate: !dueDate
        }
      });
    }

    // Validate due date
    const parsedDueDate = new Date(dueDate);
    const now = new Date();
    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ 
        msg: 'Invalid due date format' 
      });
    }
    // Add a 1-minute buffer to ensure the date is in the future
    if (parsedDueDate <= new Date(now.getTime() + 60000)) {
      return res.status(400).json({ 
        msg: 'Due date must be at least 1 minute in the future' 
      });
    }

    // Validate questions array
    if (!Array.isArray(questions) || questions.length === 0) {
      console.log('Invalid questions array:', questions);
      return res.status(400).json({ msg: 'At least one question is required' });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.questionText || !question.options || !Array.isArray(question.options)) {
        console.log(`Invalid question format at index ${i}:`, question);
        return res.status(400).json({ 
          msg: `Invalid question format at index ${i}`,
          question: question
        });
      }

      // Validate options
      if (question.options.length === 0) {
        console.log(`Question ${i + 1} has no options`);
        return res.status(400).json({ 
          msg: `Question ${i + 1} must have at least one option` 
        });
      }

      // Validate that at least one option is correct
      if (!question.options.some(opt => opt.isCorrect)) {
        console.log(`Question ${i + 1} has no correct option`);
        return res.status(400).json({ 
          msg: `Question ${i + 1} must have at least one correct option` 
        });
      }
    }

    // Create the assignment
    const assignment = new Assignment({
      title: title.trim(),
      description: description.trim(),
      course: course,
      instructor: req.user._id,
      questions: questions.map(q => ({
        questionText: q.questionText.trim(),
        options: q.options.map(opt => ({
          text: opt.text.trim(),
          isCorrect: opt.isCorrect
        })),
        points: q.points || 1
      })),
      dueDate: parsedDueDate
    });

    console.log('Attempting to save assignment:', JSON.stringify(assignment, null, 2));

    // Save the assignment
    const savedAssignment = await assignment.save();
    console.log('Assignment created successfully:', savedAssignment);

    // Add the assignment to the course's assignments array
    await Course.findByIdAndUpdate(
      savedAssignment.course,
      { $addToSet: { assignments: savedAssignment._id } }
    );

    // Return the created assignment
    res.status(201).json({
      msg: 'Assignment created successfully',
      assignment: savedAssignment
    });

  } catch (err) {
    console.error('Assignment creation error:', err);
    
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      console.log('Validation errors:', errors);
      return res.status(400).json({ 
        msg: 'Validation error',
        errors: errors
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      console.log('Duplicate assignment error');
      return res.status(400).json({ 
        msg: 'Duplicate assignment title for this course' 
      });
    }

    // Handle other errors
    console.error('Unexpected error:', err);
    return res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Get assignments for a course
exports.getCourseAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .populate('instructor', 'name')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (err) {
    console.error('Error fetching course assignments:', err);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Get a single assignment
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('instructor', 'name')
      .populate('course', 'title');

    if (!assignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (err) {
    console.error('Error fetching assignment:', err);
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
}; 