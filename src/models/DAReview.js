const mongoose = require('mongoose');

const DAReviewSchema = new mongoose.Schema(
  {
    workId: {
      type: String,
      required: true,
      index: true
    },
    feasible: {
      type: Boolean,
      required: true
    },
    estimatedTimeMonths: {
      type: Number,
      required: true
    },
    prohibited: {
      type: Boolean,
      default: false
    },
    remarks: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: String,
      required: true
    },
    reviewedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

module.exports = mongoose.models.DAReview || mongoose.model('DAReview', DAReviewSchema, 'da_reviews');

