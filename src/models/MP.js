const mongoose = require('mongoose');

const MPSchema = new mongoose.Schema(
  {
    mpId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    house: {
      type: String,
      enum: ['Lok Sabha', 'Rajya Sabha'],
      required: true
    },
    state: {
      type: String,
      required: true,
      index: true
    },
    constituency: {
      type: String,
      required: true
    },
    term: {
      type: String
    },
    oathDate: {
      type: Date
    },
    allocatedFunds: {
      type: Number,
      default: 0
    },
    utilizedFunds: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

module.exports = mongoose.models.MP || mongoose.model('MP', MPSchema, 'mps');

