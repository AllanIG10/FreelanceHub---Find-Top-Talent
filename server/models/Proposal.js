const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Freelancer ID is required'],
    },
    coverLetter: {
      type: String,
      required: [true, 'Cover letter is required'],
      trim: true,
      minlength: [50, 'Cover letter must be at least 50 characters'],
      maxlength: [5000, 'Cover letter cannot exceed 5000 characters'],
    },
    bidAmount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [1, 'Bid amount must be at least 1'],
    },
    estimatedDays: {
      type: Number,
      required: [true, 'Estimated days is required'],
      min: [1, 'Estimated days must be at least 1'],
    },
    portfolioLinks: {
      type: [String],
      default: [],
    },
    attachments: {
      type: [
        {
          url: String,
          name: String,
          type: String,
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'accepted', 'rejected'],
      default: 'pending',
    },
    clientNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Client note cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one proposal per freelancer per job
proposalSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });
proposalSchema.index({ freelancerId: 1, status: 1 });
proposalSchema.index({ jobId: 1, status: 1 });

module.exports = mongoose.model('Proposal', proposalSchema);
