const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required'],
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewed user is required'],
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
    },
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
      default: '',
    },
    type: {
      type: String,
      enum: ['client_to_freelancer', 'freelancer_to_client'],
      required: [true, 'Review type is required'],
    },
  },
  {
    timestamps: true,
  }
);

// One review per fromUser per job
reviewSchema.index({ fromUser: 1, jobId: 1 }, { unique: true });
reviewSchema.index({ toUser: 1, createdAt: -1 });
reviewSchema.index({ jobId: 1 });

// Post-save hook: update toUser's average rating
reviewSchema.post('save', async function () {
  try {
    const User = mongoose.model('User');
    const result = await mongoose.model('Review').aggregate([
      { $match: { toUser: this.toUser } },
      {
        $group: {
          _id: '$toUser',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      await User.findByIdAndUpdate(this.toUser, {
        rating: Math.round(result[0].avgRating * 10) / 10,
        reviewCount: result[0].count,
      });
    }
  } catch (error) {
    console.error('Error updating user rating after review save:', error.message);
  }
});

// Post-remove hook: recalculate rating
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  try {
    const User = mongoose.model('User');
    const result = await mongoose.model('Review').aggregate([
      { $match: { toUser: doc.toUser } },
      {
        $group: {
          _id: '$toUser',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      await User.findByIdAndUpdate(doc.toUser, {
        rating: Math.round(result[0].avgRating * 10) / 10,
        reviewCount: result[0].count,
      });
    } else {
      await User.findByIdAndUpdate(doc.toUser, { rating: 0, reviewCount: 0 });
    }
  } catch (error) {
    console.error('Error recalculating user rating after review delete:', error.message);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
