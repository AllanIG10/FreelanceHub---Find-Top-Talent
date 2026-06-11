const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ['fixed', 'hourly'],
      default: 'fixed',
    },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
    },
    budget: {
      type: budgetSchema,
      required: [true, 'Budget is required'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    skills: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'in-progress', 'completed'],
      default: 'open',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client ID is required'],
    },
    proposals: {
      type: Number,
      default: 0,
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
    views: {
      type: Number,
      default: 0,
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'intermediate', 'expert'],
      default: 'intermediate',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    selectedFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ clientId: 1, status: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
