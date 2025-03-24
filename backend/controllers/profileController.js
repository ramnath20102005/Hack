const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save uploaded files to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
}).single('profileImage');

// Default profile image path
const defaultProfileImage = '/public/default-profile.jpg';

// Helper function to construct the full URL for profile image
const getProfileImageUrl = (profileImage) => {
  // If profileImage is missing or invalid, return the default image URL
  if (!profileImage || profileImage.startsWith('https://via.placeholder.com')) {
    return 'http://localhost:5000/public/default-profile.jpg';
  }
  // If profileImage is already a full URL, return it directly
  if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
    return profileImage;
  }
  // Otherwise, construct the full URL
  return `http://localhost:5000${profileImage}`;
};

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Apply default image if no profile image is set
  if (!user.profileImage) {
    user.profileImage = defaultProfileImage; // Set default image path
  }

  // Return the full URL for the profile image
  const profileData = {
    ...user.toObject(),
    profileImage: getProfileImageUrl(user.profileImage),
  };

  res.json(profileData);
});

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.status(400);
      throw new Error(err.message || 'Error uploading file');
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Update fields
    const { name, bio, skills, interests, achievements } = req.body;
    if (name) user.name = name;
    if (bio) user.bio = bio;

    // Handle skills, interests, and achievements as arrays
    if (skills) {
      user.skills = Array.isArray(skills) ? skills : [skills];
    }
    if (interests) {
      user.interests = Array.isArray(interests) ? interests : [interests];
    }
    if (achievements) {
      user.achievements = Array.isArray(achievements) ? achievements : [achievements];
    }

    // Update profile image if a file is uploaded
    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`; // Save file path
    }

    // Save the updated user
    const updatedUser = await user.save();

    // Return the updated user data
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
      skills: updatedUser.skills,
      interests: updatedUser.interests,
      achievements: updatedUser.achievements,
      profileImage: getProfileImageUrl(updatedUser.profileImage),
    });
  });
});

module.exports = { getProfile, updateProfile };