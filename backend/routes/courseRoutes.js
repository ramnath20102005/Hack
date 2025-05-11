const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const CourseHistory = require('../models/CourseHistory');
const Assignment = require('../models/Assignment');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for multer
const fileFilter = (req, file, cb) => {
  // Accept only PDF and video files
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and video files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Create a new course
router.post('/', auth, checkRole('instructor'), async (req, res) => {
  try {
    const { title, description, template = 'basic' } = req.body;

    if (!title || !description) {
      return res.status(400).json({ msg: 'Please provide title and description' });
    }

    const course = new Course({
      title,
      description,
      template,
      instructor: req.user._id
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.error('Course creation error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Upload course material (PDF or Video)
router.post('/:courseId/materials', auth, checkRole('instructor'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded or invalid file type' });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (!req.body.title) {
      return res.status(400).json({ msg: 'Title is required' });
    }

    const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'video';
    const fileUrl = `/uploads/${req.file.filename}`;
    
    course.materials.push({
      type: fileType,
      title: req.body.title,
      fileUrl: fileUrl,
      uploadDate: new Date()
    });

    await course.save();
    res.json(course);
  } catch (err) {
    console.error('Error uploading material:', err);
    // If there's a file upload error, remove the uploaded file
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error removing file:', unlinkErr);
      });
    }
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get course materials
router.get('/:courseId/materials', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user is instructor or student enrolled in the course
    if (course.instructor.toString() !== req.user._id.toString() && 
        !course.students.includes(req.user._id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(course.materials);
  } catch (err) {
    console.error('Error fetching materials:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Delete course material
router.delete('/:courseId/materials/:materialId', auth, checkRole('instructor'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Find the material by its ID
    const materialIndex = course.materials.findIndex(m => m._id.toString() === req.params.materialId);
    if (materialIndex === -1) {
      return res.status(404).json({ msg: 'Material not found' });
    }

    // Get the material before removing it
    const material = course.materials[materialIndex];

    // Remove the file from the uploads directory
    const filePath = path.join(uploadsDir, path.basename(material.fileUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove the material from the course
    course.materials.splice(materialIndex, 1);
    await course.save();

    res.json({ msg: 'Material deleted successfully' });
  } catch (err) {
    console.error('Error deleting material:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Search courses
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ msg: 'Search query is required' });
    }

    // Sanitize the search query
    const sanitizedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create indexes for better performance
    try {
      await Course.collection.createIndex({ title: 1 });
      await Course.collection.createIndex({ description: 1 });
    } catch (err) {
      // Index might already exist, which is fine
      console.log('Index creation skipped:', err.message);
    }

    // Use regex search with case-insensitive option
    const courses = await Course.find({
      $or: [
        { title: { $regex: sanitizedQuery, $options: 'i' } },
        { description: { $regex: sanitizedQuery, $options: 'i' } }
      ]
    })
    .populate('instructor', 'name email')
    .select('title description thumbnail duration level instructor materials')
    .limit(10)
    .sort({ title: 1 }); // Sort by title for consistent results

    res.json(courses);
  } catch (err) {
    console.error('Search error:', err);
    // Return empty array instead of error to prevent frontend issues
    res.json([]);
  }
});

// Get all courses for a student
router.get('/student', auth, async (req, res) => {
  try {
    // Fetch all courses and populate instructor information
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .select('title description thumbnail duration level instructor materials');
    
    // Get course history for the student
    const courseHistory = await CourseHistory.find({ student: req.user._id });
    const enrolledCourseIds = courseHistory.map(h => h.course.toString());
    
    // Add an isEnrolled field to each course
    const coursesWithEnrollment = courses.map(course => ({
      ...course.toObject(),
      isEnrolled: course.students?.includes(req.user._id) || enrolledCourseIds.includes(course._id.toString())
    }));
    
    res.json(coursesWithEnrollment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Get all courses for the instructor
router.get('/instructor', auth, checkRole('instructor'), async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id });
    res.json(courses);
  } catch (err) {
    console.error('Error fetching instructor courses:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get available courses (for students)
router.get('/available', auth, async (req, res) => {
  try {
    console.log('Fetching available courses for user:', req.user._id);
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB is not connected. Current state:', mongoose.connection.readyState);
      return res.status(500).json({ 
        msg: 'Database connection error',
        error: 'MongoDB is not connected'
      });
    }

    // Get user ID from request
    const userId = req.user._id;
    if (!userId) {
      console.error('User ID not found in request');
      return res.status(400).json({ 
        msg: 'User ID not found',
        error: 'Authentication token may be invalid'
      });
    }

    console.log('Querying courses for user:', userId);
    // Get all courses that the student is not enrolled in
    const courses = await Course.find({
      students: { $ne: userId }
    })
    .populate('instructor', 'name')
    .select('title description materials liveClasses');

    console.log('Found courses:', courses?.length || 0);
    res.json(courses || []);
  } catch (err) {
    console.error('Error in /available route:', err);
    console.error('Error stack:', err.stack);
    
    // Handle specific MongoDB errors
    if (err.name === 'MongoError') {
      return res.status(500).json({ 
        msg: 'Database error',
        error: err.message
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        msg: 'Validation error',
        error: err.message
      });
    }

    // Default error response
    res.status(500).json({ 
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Get a single course
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Fetching course details for ID:', req.params.id, 'by user:', req.user._id);
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('assignments', 'title description dueDate');
    
    if (!course) {
      console.log('Course not found for ID:', req.params.id);
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user is authorized (either instructor or enrolled student)
    const isInstructor = course.instructor._id.toString() === req.user._id.toString();
    const isEnrolled = course.students?.includes(req.user._id);
    
    if (!isInstructor && !isEnrolled) {
      console.log('User not authorized for course:', req.params.id, 'User:', req.user._id);
      return res.status(401).json({ msg: 'Not authorized to view this course' });
    }

    res.json({
      course: {
        ...course.toObject(),
        isInstructor,
        isEnrolled
      },
      assignments: course.assignments || []
    });
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Delete a course and its materials
router.delete('/:courseId', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Delete all associated files
    for (const material of course.materials) {
      const filePath = path.join(uploadsDir, path.basename(material.fileUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete the course
    await Course.findByIdAndDelete(req.params.courseId);

    res.json({ msg: 'Course and all associated materials deleted successfully' });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Start a live class
router.post('/:courseId/live-class/:classId/start', auth, checkRole('instructor'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const liveClass = course.liveClasses.id(req.params.classId);
    if (!liveClass) {
      return res.status(404).json({ msg: 'Live class not found' });
    }

    // Update the live class status
    liveClass.status = 'active';
    liveClass.startedAt = new Date();
    await course.save();

    res.json({ msg: 'Live class started successfully', liveClass });
  } catch (err) {
    console.error('Error starting live class:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Enroll in a course
router.post('/:courseId/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user is already enrolled
    if (course.students.includes(req.user._id)) {
      return res.status(400).json({ msg: 'Already enrolled in this course' });
    }

    // Add user to course students
    course.students.push(req.user._id);
    await course.save();

    // Create course history entry
    const history = new CourseHistory({
      student: req.user._id,
      course: course._id,
      viewedAt: new Date()
    });
    await history.save();

    res.json({ msg: 'Successfully enrolled in course' });
  } catch (err) {
    console.error('Error enrolling in course:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get course history for a student for a specific course
router.get('/:id/history', auth, async (req, res) => {
  try {
    const history = await CourseHistory.findOne({
      student: req.user._id,
      course: req.params.id
    });
    res.json(history || {});
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Download course material and track in CourseHistory
router.get('/:courseId/materials/:materialId/download', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Check if user is enrolled
    if (!course.students.includes(req.user._id)) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Find the material
    const material = course.materials.id(req.params.materialId);
    if (!material) {
      return res.status(404).json({ msg: 'Material not found' });
    }

    // Serve the file
    const filePath = path.join(uploadsDir, path.basename(material.fileUrl));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ msg: 'File not found on server' });
    }

    // Update CourseHistory
    const history = await CourseHistory.findOne({ student: req.user._id, course: course._id });
    if (history && !history.materialsDownloaded.includes(material._id)) {
      history.materialsDownloaded.push(material._id);
      await history.save();
    }

    res.download(filePath, material.title + path.extname(material.fileUrl));
  } catch (err) {
    console.error('Error downloading material:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get course progress for a student
router.get('/:courseId/progress', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // Get all assignments for the course
    const assignments = await Assignment.find({ course: courseId }).select('_id');
    const totalAssignments = assignments.length;

    // Get CourseHistory for this student and course
    const history = await CourseHistory.findOne({ student: studentId, course: courseId });
    const attemptedAssignments = history
      ? history.assignments.filter(a =>
          assignments.some(asn => String(asn._id) === String(a.assignment))
        ).length
      : 0;

    const progress = totalAssignments === 0 ? 100 : Math.round((attemptedAssignments / totalAssignments) * 100);

    res.json({
      totalAssignments,
      attemptedAssignments,
      progress
    });
  } catch (err) {
    console.error('Error fetching course progress:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router; 