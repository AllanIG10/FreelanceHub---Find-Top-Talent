const { validationResult } = require('express-validator');
const Job = require('../models/Job');
const Proposal = require('../models/Proposal');

/**
 * @desc    Create a new job
 * @route   POST /api/jobs
 * @access  Private (client)
 */
const createJob = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, budget, deadline, skills, category, experienceLevel, attachments } = req.body;

    const job = await Job.create({
      title,
      description,
      budget,
      deadline,
      skills: skills || [],
      category,
      experienceLevel: experienceLevel || 'intermediate',
      attachments: attachments || [],
      clientId: req.user._id,
    });

    await job.populate('clientId', 'name email avatar rating');

    res.status(201).json({
      success: true,
      message: 'Job posted successfully.',
      job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all jobs (paginated, filterable, searchable)
 * @route   GET /api/jobs
 * @access  Public
 */
const getJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      skills,
      budgetMin,
      budgetMax,
      budgetType,
      status = 'open',
      experienceLevel,
      sort = '-createdAt',
    } = req.query;

    const query = { isActive: true };

    // Status filter
    if (status) query.status = status;

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) query.category = { $regex: category, $options: 'i' };

    // Skills filter (comma-separated)
    if (skills) {
      const skillArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (skillArray.length > 0) {
        query.skills = { $in: skillArray };
      }
    }

    // Budget filters
    if (budgetMin || budgetMax) {
      query['budget.min'] = {};
      if (budgetMin) query['budget.min'].$gte = Number(budgetMin);
      if (budgetMax) query['budget.max'] = { $lte: Number(budgetMax) };
    }

    if (budgetType) query['budget.type'] = budgetType;

    // Experience level filter
    if (experienceLevel) query.experienceLevel = experienceLevel;

    const skip = (Number(page) - 1) * Number(limit);

    // Sort options
    let sortQuery = {};
    if (search) {
      sortQuery = { score: { $meta: 'textScore' }, ...parseSortString(sort) };
    } else {
      sortQuery = parseSortString(sort);
    }

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('clientId', 'name avatar rating totalHired location')
        .sort(sortQuery)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Job.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: parse sort string like "-createdAt,title" into Mongoose sort object
 */
const parseSortString = (sort) => {
  const result = {};
  const fields = sort.split(',');
  for (const field of fields) {
    if (field.startsWith('-')) {
      result[field.slice(1)] = -1;
    } else {
      result[field] = 1;
    }
  }
  return result;
};

/**
 * @desc    Get a single job by ID
 * @route   GET /api/jobs/:id
 * @access  Public
 */
const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('clientId', 'name avatar bio rating totalHired location createdAt')
      .populate('selectedFreelancer', 'name avatar title rating');

    if (!job || !job.isActive) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    // Increment view count (fire and forget)
    Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec().catch(() => {});

    res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a job
 * @route   PUT /api/jobs/:id
 * @access  Private (client, owner)
 */
const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job || !job.isActive) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this job.' });
    }

    // Cannot update a closed or completed job
    if (['closed', 'completed'].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update a job with status '${job.status}'.`,
      });
    }

    const allowedUpdates = [
      'title', 'description', 'budget', 'deadline', 'skills',
      'category', 'status', 'experienceLevel', 'attachments',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    await job.save();
    await job.populate('clientId', 'name email avatar rating');

    res.status(200).json({ success: true, message: 'Job updated successfully.', job });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a job (soft delete)
 * @route   DELETE /api/jobs/:id
 * @access  Private (client, owner)
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job || !job.isActive) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this job.' });
    }

    // Soft delete
    job.isActive = false;
    job.status = 'closed';
    await job.save();

    // Delete associated proposals
    await Proposal.deleteMany({ jobId: job._id });

    res.status(200).json({ success: true, message: 'Job deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get jobs posted by the current client
 * @route   GET /api/jobs/client/my-jobs
 * @access  Private (client)
 */
const getClientJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { clientId: req.user._id, isActive: true };

    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Job.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: jobs,
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
 * @desc    Get proposals for a specific job (client only)
 * @route   GET /api/jobs/:id/proposals
 * @access  Private (client, job owner)
 */
const getJobProposals = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job || !job.isActive) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view proposals for this job.',
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    const query = { jobId: req.params.id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .populate('freelancerId', 'name avatar title skills rating reviewCount hourlyRate location availability')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Proposal.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: proposals,
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

module.exports = {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  getClientJobs,
  getJobProposals,
};
