const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  getClientJobs,
  getJobProposals,
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Validation rules
const jobValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').trim().isLength({ min: 20, max: 10000 }).withMessage('Description must be 20-10000 characters'),
  body('budget.min').isNumeric().withMessage('Minimum budget must be a number'),
  body('budget.max').isNumeric().withMessage('Maximum budget must be a number'),
  body('budget.type').isIn(['fixed', 'hourly']).withMessage('Budget type must be fixed or hourly'),
  body('deadline').isISO8601().withMessage('Deadline must be a valid date'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('experienceLevel').optional().isIn(['entry', 'intermediate', 'expert']).withMessage('Invalid experience level'),
];

// GET /api/jobs — public, paginated
router.get('/', getJobs);

// GET /api/jobs/client/my-jobs — must be before /:id
router.get('/client/my-jobs', protect, authorize('client'), getClientJobs);

// GET /api/jobs/:id — public
router.get('/:id', getJob);

// GET /api/jobs/:id/proposals — client only
router.get('/:id/proposals', protect, authorize('client'), getJobProposals);

// POST /api/jobs — client only
router.post('/', protect, authorize('client'), jobValidation, createJob);

// PUT /api/jobs/:id — client only
router.put('/:id', protect, authorize('client'), updateJob);

// DELETE /api/jobs/:id — client only
router.delete('/:id', protect, authorize('client'), deleteJob);

module.exports = router;
