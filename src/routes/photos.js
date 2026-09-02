const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Photo = require('../models/Photo');
const Inspection = require('../models/Inspection');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `geotag-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

const mongoose = require('mongoose');
const { savePhoto, getPhotosForWork } = require('../utils/database');

// POST /api/photos/upload - Upload geotagged photo
router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded.' });
    }

    const { workId, inspectionId, latitude, longitude } = req.body;

    if (!workId) {
      return res.status(400).json({ success: false, message: 'Work ID is required.' });
    }

    const lat = latitude ? parseFloat(latitude) : 0;
    const lng = longitude ? parseFloat(longitude) : 0;

    // Persist to unified database engine
    const savedPhoto = savePhoto({
      workId,
      inspectionId: inspectionId || null,
      filePath: `/uploads/photos/${req.file.filename}`,
      fileName: req.file.originalname,
      latitude: lat,
      longitude: lng
    });

    // Also persist to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const photoDoc = new Photo({
          workId,
          inspectionId: inspectionId || null,
          filePath: `/uploads/photos/${req.file.filename}`,
          fileName: req.file.originalname,
          location: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          capturedAt: new Date()
        });
        await photoDoc.save();

        if (inspectionId) {
          await Inspection.findByIdAndUpdate(inspectionId, {
            $push: { photos: photoDoc._id }
          });
        }

        const cleanId = String(workId).trim();
        const rawNumId = cleanId.replace(/^(MPLADS-|WORK-CMP-|WORK-REC-)/i, '');
        const filter = {
          $or: [
            { workId: cleanId },
            { sourceWorkId: cleanId },
            { sourceWorkId: rawNumId },
            { workId: `WORK-CMP-${rawNumId}` },
            { workId: `WORK-REC-${rawNumId}` },
            { workId: `MPLADS-${rawNumId}` }
          ]
        };
        const WorkModel = require('../models/Work');
        await WorkModel.findOneAndUpdate(filter, { $set: { hasImages: true } });
        if (mongoose.connection.db) {
          await mongoose.connection.db.collection('works').updateOne(filter, { $set: { hasImages: true } });
        }
      } catch (dbErr) {
        console.warn('[MongoDB Warning]:', dbErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Geotagged photo uploaded and recorded successfully.',
      data: savedPhoto
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/photos/:workId - List photos for a Work ID
router.get('/:workId', async (req, res) => {
  try {
    const { workId } = req.params;
    let photos = getPhotosForWork(workId);

    if ((!photos || photos.length === 0) && mongoose.connection.readyState === 1) {
      photos = await Photo.find({ workId }).sort({ capturedAt: -1 });
    }

    res.json({ success: true, count: photos.length, data: photos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
