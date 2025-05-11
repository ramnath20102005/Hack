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

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    title: user.title,
    skills: user.skills,
    interests: user.interests,
    achievements: user.achievements,
    experience: user.experience,
    projects: user.projects,
    profileImage: user.profileImage,
    role: user.role,
    // Student fields
    education: user.education,
    year: user.year,
    major: user.major,
    // Instructor fields
    department: user.department,
    expertise: user.expertise,
    office: user.office
  });
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
  const { name, bio, skills, interests, achievements, title, experience, projects, profileImage,
    education, year, major, department, expertise, office } = req.body;
  
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

  // Student-specific fields
  if (education !== undefined) user.education = education;
  if (year !== undefined) user.year = year;
  if (major !== undefined) user.major = major;

  // Instructor-specific fields
  if (department !== undefined) user.department = department;
  if (expertise) {
    user.expertise = Array.isArray(expertise) ? expertise : expertise.split(',').map(e => e.trim());
  }
  if (office !== undefined) user.office = office;

  try {
    // Save the updated user
    const updatedUser = await user.save();

    // Return the updated user data (all relevant fields)
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
      profileImage: updatedUser.profileImage,
      role: updatedUser.role,
      // Student fields
      education: updatedUser.education,
      year: updatedUser.year,
      major: updatedUser.major,
      // Instructor fields
      department: updatedUser.department,
      expertise: updatedUser.expertise,
      office: updatedUser.office
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

module.exports = { getProfile, updateProfile };