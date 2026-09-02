const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema(
  {
    workId: {
      type: String,
      required: true,
      index: true
    },
    inspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection'
    },
    filePath: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    capturedAt: {
      type: Date,
      default: Date.now
    },
    exifData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

PhotoSchema.index({ location: '2dsphere' });
PhotoSchema.index({ workId: 1, capturedAt: -1 });

module.exports = mongoose.models.Photo || mongoose.model('Photo', PhotoSchema, 'geotagged_photos');

