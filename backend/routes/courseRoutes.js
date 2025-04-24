const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

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
router.post('/', auth, async (req, res) => {
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
router.post('/:courseId/materials', auth, upload.single('file'), async (req, res) => {
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
router.delete('/:courseId/materials/:materialId', auth, async (req, res) => {
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

// Get all courses for a student
router.get('/student', auth, async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user.id })
      .populate('instructor', 'name email');
    res.json(courses);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Get all courses for the instructor
router.get('/instructor', auth, async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id });
    res.json(courses);
  } catch (err) {
    console.error('Error fetching instructor courses:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get a single course
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }
    res.json(course);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ msg: 'Server error' });
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
router.post('/:courseId/live-class/:classId/start', auth, async (req, res) => {
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

module.exports = router; 