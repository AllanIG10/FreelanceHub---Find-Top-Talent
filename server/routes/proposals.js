const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  submitProposal,
  getProposal,
  updateProposalStatus,
  getFreelancerProposals,
  withdrawProposal,
} = require('../controllers/proposalController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// Validation rules
const proposalValidation = [
  body('jobId').isMongoId().withMessage('Invalid job ID'),
  body('coverLetter').trim().isLength({ min: 50, max: 5000 }).withMessage('Cover letter must be 50-5000 characters'),
  body('bidAmount').isNumeric({ min: 1 }).withMessage('Bid amount must be a positive number'),
  body('estimatedDays').isInt({ min: 1 }).withMessage('Estimated days must be at least 1'),
  body('portfolioLinks').optional().isArray().withMessage('Portfolio links must be an array'),
];

// POST /api/proposals — freelancer
router.post('/', protect, authorize('freelancer'), proposalValidation, submitProposal);

// GET /api/proposals/my — freelancer's own proposals
router.get('/my', protect, authorize('freelancer'), getFreelancerProposals);

// GET /api/proposals/:id — proposal owner or job client
router.get('/:id', protect, getProposal);

// PATCH /api/proposals/:id/status — client changes status
router.patch(
  '/:id/status',
  protect,
  authorize('client'),
  [
    body('status').isIn(['shortlisted', 'accepted', 'rejected']).withMessage('Invalid status'),
    body('clientNote').optional().isString().isLength({ max: 1000 }),
  ],
  updateProposalStatus
);

// DELETE /api/proposals/:id — freelancer withdraws
router.delete('/:id', protect, authorize('freelancer'), withdrawProposal);

module.exports = router;
