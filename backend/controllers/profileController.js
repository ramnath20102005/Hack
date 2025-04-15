const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(user);
});

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update fields
  const { name, bio, skills, interests, achievements, title, experience, projects, profileImage } = req.body;
  
  if (name) user.name = name;
  if (bio) user.bio = bio;
  if (title) user.title = title;
  if (experience) user.experience = experience;
  if (projects) user.projects = projects;
  if (achievements) user.achievements = achievements;

  // Handle skills and interests as arrays
  if (skills) {
    user.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
  }
  if (interests) {
    user.interests = Array.isArray(interests) ? interests : interests.split(',').map(s => s.trim());
  }

  // Handle base64 profile image
  if (profileImage && profileImage.startsWith('data:image')) {
    user.profileImage = profileImage;
  }

  // Save the updated user
  const updatedUser = await user.save();

  // Return the updated user data
  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    bio: updatedUser.bio,
    title: updatedUser.title,
    skills: updatedUser.skills,
    interests: updatedUser.interests,
    achievements: updatedUser.achievements,
    experience: updatedUser.experience,
    projects: updatedUser.projects,
    profileImage: updatedUser.profileImage
  });
});

module.exports = { getProfile, updateProfile };