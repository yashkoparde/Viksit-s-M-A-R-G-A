const mongoose = require('mongoose');

const WorkSchema = new mongoose.Schema(
  {
    workId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    mpId: {
      type: String,
      ref: 'MP',
      index: true
    },
    state: {
      type: String,
      required: true,
      index: true
    },
    district: {
      type: String,
      required: true,
      index: true
    },
    constituency: {
      type: String,
      index: true
    },
    department: {
      type: String
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Education', 'Healthcare', 'Infrastructure', 'Sanitation', 'Water Supply', 'Community Assets', 'Other'],
      default: 'Other',
      index: true
    },
    recommendedAmount: {
      type: Number,
      default: 0
    },
    sanctionedAmount: {
      type: Number,
      default: 0
    },
    disbursedAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['RECOMMENDED', 'UNDER_DA_REVIEW', 'SANCTIONED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'DELAYED'],
      default: 'RECOMMENDED',
      index: true
    },
    physicalProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    sanctionDate: {
      type: Date
    },
    anticipatedCompletionDate: {
      type: Date
    },
    actualCompletionDate: {
      type: Date
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      },
      address: String,
      block: String,
      village: String
    },
    isNodalSampled: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

WorkSchema.index({ 'location': '2dsphere' });
WorkSchema.index({ 'sourceWorkId': 1 });

module.exports = mongoose.models.Work || mongoose.model('Work', WorkSchema, 'works');

