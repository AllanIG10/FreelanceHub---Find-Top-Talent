const Review = require('../models/Review');
const Proposal = require('../models/Proposal');
const Notification = require('../models/Notification');
const { getSocketId } = require('../socket');

/**
 * @desc    Submit a review
 * @route   POST /api/reviews
 * @access  Private
 */
const submitReview = async (req, res, next) => {
  try {
    const { toUser, jobId, proposalId, rating, comment, type } = req.body;

    if (!toUser || !jobId || !rating || !type) {
      return res.status(400).json({
        success: false,
        message: 'toUser, jobId, rating, and type are required.',
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    // Check for duplicate review
    const existing = await Review.findOne({ fromUser: req.user._id, jobId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this job.',
      });
    }

    // Cannot review yourself
    if (toUser === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself.' });
    }

    // Validate type matches role
    if (req.user.role === 'client' && type !== 'client_to_freelancer') {
      return res.status(400).json({
        success: false,
        message: 'Clients can only submit client_to_freelancer reviews.',
      });
    }
    if (req.user.role === 'freelancer' && type !== 'freelancer_to_client') {
      return res.status(400).json({
        success: false,
        message: 'Freelancers can only submit freelancer_to_client reviews.',
      });
    }

    const review = await Review.create({
      fromUser: req.user._id,
      toUser,
      jobId,
      proposalId: proposalId || null,
      rating,
      comment: comment || '',
      type,
    });

    await review.populate('fromUser', 'name avatar title');

    // Notify the reviewed user
    const io = req.app.get('io');
    try {
      const notification = await Notification.create({
        userId: toUser,
        type: 'review_received',
        title: 'New Review Received ⭐',
        message: `${req.user.name} left you a ${rating}-star review.`,
        link: `/profile/${req.user._id}`,
        metadata: { reviewId: review._id, fromUser: req.user._id },
      });

      if (io) {
        const socketId = getSocketId(toUser.toString());
        if (socketId) {
          io.to(socketId).emit('notification', notification);
        }
      }
    } catch (_) {
      // Notification failure should not fail the review creation
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this job.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get reviews for a specific user (paginated)
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
const getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const query = { toUser: req.params.userId };
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('fromUser', 'name avatar title role')
        .populate('jobId', 'title category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments(query),
    ]);

    // Compute rating summary
    const ratingSummary = await Review.aggregate([
      { $match: { toUser: require('mongoose').Types.ObjectId.createFromHexString(req.params.userId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      summary: ratingSummary[0] || {
        avgRating: 0,
        totalReviews: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0,
      },
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitReview, getUserReviews };
