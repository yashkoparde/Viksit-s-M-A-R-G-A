const mongoose = require('mongoose');

const StateSchema = new mongoose.Schema(
  {
    stateId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['State', 'Union Territory'],
      default: 'State'
    },
    totalMPs: {
      type: Number,
      default: 0
    },
    allocatedAmount: {
      type: Number,
      default: 0
    },
    utilizedAmount: {
      type: Number,
      default: 0
    },
    worksCompleted: {
      type: Number,
      default: 0
    },
    worksPending: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('State', StateSchema);
