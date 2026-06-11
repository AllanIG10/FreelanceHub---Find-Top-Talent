const User = require('../models/User');
const Job = require('../models/Job');
const Proposal = require('../models/Proposal');
const Review = require('../models/Review');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

/**
 * @desc    Get a user's public profile
 * @route   GET /api/users/profile/:id
 * @access  Public
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -googleId -passwordResetToken -passwordResetExpire -isActive'
    );

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user's profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'bio', 'title', 'skills', 'hourlyRate',
      'location', 'availability', 'experience', 'portfolio',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully.', user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload / update avatar
 * @route   POST /api/users/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'freelance-platform/avatars',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Delete old avatar from Cloudinary if it exists and is from Cloudinary
    const currentUser = await User.findById(req.user._id);
    if (currentUser.avatar && currentUser.avatar.includes('cloudinary.com')) {
      const publicIdMatch = currentUser.avatar.match(/\/([^/]+)\.[a-z]+$/);
      if (publicIdMatch) {
        await deleteFromCloudinary(`freelance-platform/avatars/${publicIdMatch[1]}`).catch(() => {});
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.secure_url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully.',
      avatarUrl: result.secure_url,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paginated list of freelancers with filters
 * @route   GET /api/users/freelancers
 * @access  Public
 */
const getFreelancers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      skills,
      availability,
      minRate,
      maxRate,
      minRating,
      location,
      sort = '-rating',
    } = req.query;

    const query = { role: 'freelancer', isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (skills) {
      const skillArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (skillArray.length > 0) query.skills = { $in: skillArray };
    }

    if (availability) query.availability = availability;

    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = Number(minRate);
      if (maxRate) query.hourlyRate.$lte = Number(maxRate);
    }

    if (minRating) query.rating = { $gte: Number(minRating) };

    if (location) query.location = { $regex: location, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const sortObj = {};
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    sortObj[sortField] = sort.startsWith('-') ? -1 : 1;

    const [freelancers, total] = await Promise.all([
      User.find(query)
        .select('name avatar title bio skills rating reviewCount hourlyRate location availability totalEarnings createdAt')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: freelancers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
        hasPrevPage: Number(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get role-based dashboard stats
 * @route   GET /api/users/stats/dashboard
 * @access  Private
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const { role, _id } = req.user;

    if (role === 'client') {
      const [totalJobs, activeJobs, jobIds] = await Promise.all([
        Job.countDocuments({ clientId: _id, isActive: true }),
        Job.countDocuments({ clientId: _id, status: { $in: ['open', 'in-progress'] }, isActive: true }),
        Job.find({ clientId: _id, isActive: true }).distinct('_id'),
      ]);

      const [totalProposalsReceived, acceptedProposals] = await Promise.all([
        Proposal.countDocuments({ jobId: { $in: jobIds } }),
        Proposal.countDocuments({ jobId: { $in: jobIds }, status: 'accepted' }),
      ]);

      const acceptanceRate =
        totalProposalsReceived > 0
          ? Math.round((acceptedProposals / totalProposalsReceived) * 100)
          : 0;

      const recentJobs = await Job.find({ clientId: _id, isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title status proposals createdAt budget');

      return res.status(200).json({
        success: true,
        stats: {
          totalJobs,
          activeJobs,
          totalProposalsReceived,
          acceptedProposals,
          acceptanceRate,
          recentJobs,
        },
      });
    }

    if (role === 'freelancer') {
      const [totalProposals, acceptedProposals, pendingProposals, shortlistedProposals] = await Promise.all([
        Proposal.countDocuments({ freelancerId: _id }),
        Proposal.countDocuments({ freelancerId: _id, status: 'accepted' }),
        Proposal.countDocuments({ freelancerId: _id, status: 'pending' }),
        Proposal.countDocuments({ freelancerId: _id, status: 'shortlisted' }),
      ]);

      const user = await User.findById(_id).select('totalEarnings rating reviewCount');

      const recentProposals = await Proposal.find({ freelancerId: _id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('jobId', 'title budget status');

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentActivity = await Proposal.find({
        freelancerId: _id,
        createdAt: { $gte: thirtyDaysAgo },
      })
        .populate('jobId', 'title status budget')
        .sort({ createdAt: -1 })
        .limit(10);

      return res.status(200).json({
        success: true,
        stats: {
          totalProposals,
          acceptedProposals,
          pendingProposals,
          shortlistedProposals,
          totalEarnings: user.totalEarnings || 0,
          rating: user.rating,
          reviewCount: user.reviewCount,
          recentProposals,
          recentActivity,
        },
      });
    }

    if (role === 'admin') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [totalUsers, totalJobs, totalProposals, totalReviews, recentSignups] = await Promise.all([
        User.countDocuments({ isActive: true }),
        Job.countDocuments({ isActive: true }),
        Proposal.countDocuments({}),
        Review.countDocuments({}),
        User.find({ createdAt: { $gte: thirtyDaysAgo } })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('name email role createdAt'),
      ]);

      const usersByRole = await User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          totalJobs,
          totalProposals,
          totalReviews,
          usersByRole,
          recentSignups,
        },
      });
    }

    res.status(400).json({ success: false, message: 'Unknown role for dashboard stats.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getFreelancers,
  getDashboardStats,
};
