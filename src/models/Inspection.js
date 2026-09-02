const mongoose = require('mongoose');

const InspectionSchema = new mongoose.Schema(
  {
    workId: {
      type: String,
      required: true,
      index: true
    },
    iaId: {
      type: String,
      required: true
    },
    inspectionDate: {
      type: Date,
      default: Date.now
    },
    progressPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    remarks: {
      type: String,
      default: ''
    },
    photos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Photo'
      }
    ],
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

module.exports = mongoose.models.Inspection || mongoose.model('Inspection', InspectionSchema, 'ia_inspections');

