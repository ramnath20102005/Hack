const express = require('express');
const auth = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/profileController');
const router = express.Router();

// Profile routes (protected)
router.route('/')
  .get(auth, getProfile)
  .put(auth, updateProfile);

module.exports = router; // ✅ Ensure you export the router
