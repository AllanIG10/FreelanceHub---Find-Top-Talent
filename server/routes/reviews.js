const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { submitReview, getUserReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// POST /api/reviews — submit a review (authenticated)
router.post(
  '/',
  protect,
  [
    body('toUser').isMongoId().withMessage('Invalid toUser ID'),
    body('jobId').isMongoId().withMessage('Invalid jobId'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('type')
      .isIn(['client_to_freelancer', 'freelancer_to_client'])
      .withMessage('Invalid review type'),
    body('comment').optional().isString().isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters'),
    body('proposalId').optional().isMongoId().withMessage('Invalid proposalId'),
  ],
  submitReview
);

// GET /api/reviews/user/:userId — get reviews for a specific user
router.get('/user/:userId', getUserReviews);

module.exports = router;
