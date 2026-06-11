const User = require('../models/User');
const Job = require('../models/Job');
const Proposal = require('../models/Proposal');
const Review = require('../models/Review');

/**
 * @desc    Get paginated users with search and role filter
 * @route   GET /api/admin/users
 * @access  Private (admin)
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -passwordResetToken -passwordResetExpire')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: users,
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

/**
 * @desc    Admin update user (role, isVerified, isActive)
 * @route   PUT /api/admin/users/:id
 * @access  Private (admin)
 */
const updateUser = async (req, res, next) => {
  try {
    const allowedFields = ['role', 'isVerified', 'isActive', 'name', 'email'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    // Prevent demoting the last admin
    if (updates.role && updates.role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      const targetUser = await User.findById(req.params.id);
      if (targetUser && targetUser.role === 'admin' && adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change role of the only admin account.',
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, message: 'User updated successfully.', user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete a user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, message: 'User deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform analytics
 * @route   GET /api/admin/analytics
 * @access  Private (admin)
 */
const getAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalJobs,
      totalProposals,
      totalReviews,
      usersByRole,
      jobsByCategory,
      proposalsByStatus,
      topFreelancers,
      topClients,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Job.countDocuments({ isActive: true }),
      Proposal.countDocuments({}),
      Review.countDocuments({}),

      // Users grouped by role
      User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),

      // Jobs grouped by category
      Job.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Proposals grouped by status
      Proposal.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Top freelancers by rating
      User.find({ role: 'freelancer', isActive: true, reviewCount: { $gt: 0 } })
        .sort({ rating: -1, reviewCount: -1 })
        .limit(10)
        .select('name avatar title rating reviewCount totalEarnings'),

      // Top clients by jobs posted
      Job.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$clientId', jobCount: { $sum: 1 }, totalProposals: { $sum: '$proposals' } } },
        { $sort: { jobCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'client',
          },
        },
        { $unwind: '$client' },
        {
          $project: {
            jobCount: 1,
            totalProposals: 1,
            'client.name': 1,
            'client.avatar': 1,
            'client.email': 1,
          },
        },
      ]),
    ]);

    // Recent activity: signups, jobs, proposals grouped by date (last 30 days)
    const [recentSignups, recentJobs, recentProposals] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Job.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, isActive: true } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Proposal.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totals: { totalUsers, totalJobs, totalProposals, totalReviews },
        usersByRole,
        jobsByCategory,
        proposalsByStatus,
        recentActivity: { signups: recentSignups, jobs: recentJobs, proposals: recentProposals },
        topFreelancers,
        topClients,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin get all jobs
 * @route   GET /api/admin/jobs
 * @access  Private (admin)
 */
const getJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, category } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = { $regex: category, $options: 'i' };
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('clientId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin update a job
 * @route   PUT /api/admin/jobs/:id
 * @access  Private (admin)
 */
const updateJob = async (req, res, next) => {
  try {
    const allowedFields = ['title', 'description', 'status', 'isActive', 'category', 'skills', 'budget', 'deadline', 'experienceLevel'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const job = await Job.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('clientId', 'name email');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    res.status(200).json({ success: true, message: 'Job updated successfully.', job });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin delete a job (hard delete)
 * @route   DELETE /api/admin/jobs/:id
 * @access  Private (admin)
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    // Delete associated proposals
    await Proposal.deleteMany({ jobId: req.params.id });

    res.status(200).json({ success: true, message: 'Job and all associated proposals deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  getAnalytics,
  getJobs,
  updateJob,
  deleteJob,
};
