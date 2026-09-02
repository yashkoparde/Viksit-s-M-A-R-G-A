const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true
    },
    workId: {
      type: String,
      required: true,
      index: true
    },
    inspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection'
    },
    reportingPeriod: {
      type: String, // e.g. "January 2026"
      required: true
    },
    reportDate: {
      type: Date,
      default: Date.now
    },
    submittedDate: {
      type: Date,
      default: Date.now
    },
    documentUrl: {
      type: String
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'VERIFIED_BY_NODAL', 'REVIEWED_BY_MOSPI'],
      default: 'SUBMITTED'
    },
    remarks: String
  },
  {
    timestamps: true,
    strict: false
  }
);

module.exports = mongoose.models.Report || mongoose.model('Report', ReportSchema, 'reports');

