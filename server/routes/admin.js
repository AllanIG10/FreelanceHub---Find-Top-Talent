const express = require('express');
const router = express.Router();

const {
  getUsers,
  updateUser,
  deleteUser,
  getAnalytics,
  getJobs,
  updateJob,
  deleteJob,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

// User management
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Job management
router.get('/jobs', getJobs);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
