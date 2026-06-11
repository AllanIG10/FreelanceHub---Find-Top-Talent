const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { generateProposal, recommendJobs, analyzeResume } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// POST /api/ai/generate-proposal — any authenticated user
router.post(
  '/generate-proposal',
  protect,
  [
    body('jobTitle').trim().notEmpty().withMessage('jobTitle is required'),
    body('jobDescription').trim().isLength({ min: 20 }).withMessage('jobDescription must be at least 20 characters'),
  ],
  generateProposal
);

// POST /api/ai/recommend-jobs — freelancer only
router.post('/recommend-jobs', protect, authorize('freelancer'), recommendJobs);

// POST /api/ai/analyze-resume — any authenticated user
router.post(
  '/analyze-resume',
  protect,
  [
    body('resumeText').trim().isLength({ min: 50 }).withMessage('resumeText must be at least 50 characters'),
  ],
  analyzeResume
);

module.exports = router;
