const Proposal = require('../models/Proposal');
const Job = require('../models/Job');
const Notification = require('../models/Notification');

/**
 * Helper: create a notification and emit socket event
 */
const createNotification = async (io, { userId, type, title, message, link, metadata }) => {
  try {
    const notification = await Notification.create({ userId, type, title, message, link, metadata });

    // Emit via socket if user is online
    if (io) {
      const { getSocketId } = require('../socket');
      const socketId = getSocketId(userId.toString());
      if (socketId) {
        io.to(socketId).emit('notification', notification);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

/**
 * @desc    Submit a proposal for a job
 * @route   POST /api/proposals
 * @access  Private (freelancer)
 */
const submitProposal = async (req, res, next) => {
  try {
    const { jobId, coverLetter, bidAmount, estimatedDays, portfolioLinks, attachments } = req.body;

    // Check job exists and is open
    const job = await Job.findById(jobId).populate('clientId', 'name');
    if (!job || !job.isActive) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This job is no longer accepting proposals.' });
    }

    // Freelancer cannot propose on their own job (edge case safety)
    if (job.clientId._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot submit a proposal to your own job.' });
    }

    // Check for duplicate proposal
    const existing = await Proposal.findOne({ jobId, freelancerId: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a proposal for this job.',
      });
    }

    const proposal = await Proposal.create({
      jobId,
      freelancerId: req.user._id,
      coverLetter,
      bidAmount,
      estimatedDays,
      portfolioLinks: portfolioLinks || [],
      attachments: attachments || [],
    });

    // Increment job proposal count
    await Job.findByIdAndUpdate(jobId, { $inc: { proposals: 1 } });

    // Notify client
    const io = req.app.get('io');
    await createNotification(io, {
      userId: job.clientId._id,
      type: 'proposal_received',
      title: 'New Proposal Received',
      message: `${req.user.name} submitted a proposal for "${job.title}"`,
      link: `/jobs/${jobId}/proposals`,
      metadata: { proposalId: proposal._id, jobId, freelancerId: req.user._id },
    });

    await proposal.populate('freelancerId', 'name avatar title skills rating');

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully.',
      proposal,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a proposal for this job.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get a single proposal
 * @route   GET /api/proposals/:id
 * @access  Private (proposal owner or job client)
 */
const getProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('freelancerId', 'name avatar title skills rating reviewCount bio portfolio hourlyRate location')
      .populate('jobId', 'title description budget deadline category clientId status');

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found.' });
    }

    const job = proposal.jobId;
    const isFreelancer = proposal.freelancerId._id.toString() === req.user._id.toString();
    const isClient = job.clientId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isFreelancer && !isClient && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this proposal.' });
    }

    res.status(200).json({ success: true, proposal });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update proposal status (client only: accept/reject/shortlist)
 * @route   PATCH /api/proposals/:id/status
 * @access  Private (client)
 */
const updateProposalStatus = async (req, res, next) => {
  try {
    const { status, clientNote } = req.body;
    const allowedStatuses = ['shortlisted', 'accepted', 'rejected'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
      });
    }

    const proposal = await Proposal.findById(req.params.id).populate('jobId');
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found.' });
    }

    // Verify client owns the job
    if (proposal.jobId.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this proposal.' });
    }

    proposal.status = status;
    if (clientNote) proposal.clientNote = clientNote;
    await proposal.save();

    // If accepted, update job status and set selectedFreelancer
    if (status === 'accepted') {
      await Job.findByIdAndUpdate(proposal.jobId._id, {
        status: 'in-progress',
        selectedFreelancer: proposal.freelancerId,
      });

      // Reject all other pending proposals for this job
      await Proposal.updateMany(
        { jobId: proposal.jobId._id, _id: { $ne: proposal._id }, status: 'pending' },
        { status: 'rejected', clientNote: 'Another proposal was selected for this job.' }
      );
    }

    // Notify freelancer
    const typeMap = {
      accepted: 'proposal_accepted',
      rejected: 'proposal_rejected',
      shortlisted: 'proposal_shortlisted',
    };
    const titleMap = {
      accepted: 'Proposal Accepted! 🎉',
      rejected: 'Proposal Update',
      shortlisted: 'Proposal Shortlisted ⭐',
    };
    const msgMap = {
      accepted: `Your proposal for "${proposal.jobId.title}" has been accepted!`,
      rejected: `Your proposal for "${proposal.jobId.title}" was not selected.`,
      shortlisted: `Your proposal for "${proposal.jobId.title}" has been shortlisted!`,
    };

    const io = req.app.get('io');
    await createNotification(io, {
      userId: proposal.freelancerId,
      type: typeMap[status],
      title: titleMap[status],
      message: msgMap[status],
      link: `/proposals/${proposal._id}`,
      metadata: { proposalId: proposal._id, jobId: proposal.jobId._id },
    });

    res.status(200).json({
      success: true,
      message: `Proposal ${status} successfully.`,
      proposal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all proposals by the current freelancer
 * @route   GET /api/proposals/my
 * @access  Private (freelancer)
 */
const getFreelancerProposals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { freelancerId: req.user._id };

    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .populate('jobId', 'title description budget deadline category status clientId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Proposal.countDocuments(query),
    ]);

    // Populate client info for each job
    await Promise.all(
      proposals.map((p) =>
        p.jobId
          ? p.populate('jobId.clientId', 'name avatar rating')
          : Promise.resolve()
      )
    );

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

/**
 * @desc    Withdraw (delete) a pending proposal
 * @route   DELETE /api/proposals/:id
 * @access  Private (freelancer, owner)
 */
const withdrawProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found.' });
    }

    if (proposal.freelancerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to withdraw this proposal.' });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw a proposal with status '${proposal.status}'.`,
      });
    }

    await proposal.deleteOne();

    // Decrement job proposal count
    await Job.findByIdAndUpdate(proposal.jobId, { $inc: { proposals: -1 } });

    res.status(200).json({ success: true, message: 'Proposal withdrawn successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitProposal,
  getProposal,
  updateProposalStatus,
  getFreelancerProposals,
  withdrawProposal,
};
