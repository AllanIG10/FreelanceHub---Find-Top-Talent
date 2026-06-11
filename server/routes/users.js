const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
  uploadAvatar,
  getFreelancers,
  getDashboardStats,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadAvatar: uploadAvatarMiddleware, processUpload } = require('../middleware/upload');

// GET /api/users/freelancers — public list of freelancers
router.get('/freelancers', getFreelancers);

// GET /api/users/stats/dashboard — role-based dashboard stats
router.get('/stats/dashboard', protect, getDashboardStats);

// GET /api/users/profile/:id — public profile
router.get('/profile/:id', getProfile);

// PUT /api/users/profile — update own profile
router.put('/profile', protect, updateProfile);

// POST /api/users/avatar — upload avatar
router.post(
  '/avatar',
  protect,
  uploadAvatarMiddleware,
  uploadAvatar
);

module.exports = router;
