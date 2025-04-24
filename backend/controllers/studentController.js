const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

// Enroll in a course
exports.enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if already enrolled
    if (course.students.includes(studentId)) {
      return res.status(400).json({ msg: 'Already enrolled in this course' });
    }

    // Add student to course
    course.students.push(studentId);
    await course.save();

    res.json({ msg: 'Successfully enrolled in course' });
  } catch (err) {
    console.error('Error enrolling in course:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get enrolled courses
exports.getEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.user._id;
    const courses = await Course.find({ students: studentId })
      .populate('instructor', 'name')
      .select('title description materials liveClasses');

    res.json(courses);
  } catch (err) {
    console.error('Error fetching enrolled courses:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get student assignments
exports.getStudentAssignments = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Get all courses the student is enrolled in
    const enrolledCourses = await Course.find({ students: studentId }).select('_id');
    const courseIds = enrolledCourses.map(course => course._id);

    // Get assignments for these courses
    const assignments = await Assignment.find({ course: { $in: courseIds } })
      .populate('course', 'title')
      .populate('instructor', 'name');

    // Get submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: studentId
        });

        return {
          ...assignment.toObject(),
          submitted: !!submission,
          submissionDate: submission?.submittedAt
        };
      })
    );

    res.json(assignmentsWithStatus);
  } catch (err) {
    console.error('Error fetching student assignments:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Submit assignment
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { answers } = req.body;
    const studentId = req.user._id;

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }

    // Check if student is enrolled in the course
    const course = await Course.findOne({
      _id: assignment.course,
      students: studentId
    });
    if (!course) {
      return res.status(403).json({ msg: 'Not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    });
    if (existingSubmission) {
      return res.status(400).json({ msg: 'Assignment already submitted' });
    }

    // Validate answers
    if (!Array.isArray(answers) || answers.length !== assignment.questions.length) {
      return res.status(400).json({ msg: 'Invalid answers format' });
    }

    // Calculate score
    let score = 0;
    answers.forEach((answer, index) => {
      const question = assignment.questions[index];
      if (answer === question.correctOption) {
        score += 1;
      }
    });

    // Create submission
    const submission = new Submission({
      assignment: assignmentId,
      student: studentId,
      answers,
      score,
      submittedAt: new Date()
    });

    await submission.save();

    res.json({
      msg: 'Assignment submitted successfully',
      score,
      totalQuestions: assignment.questions.length
    });
  } catch (err) {
    console.error('Error submitting assignment:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}; 