const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const DAReview = require('../models/DAReview');
const Work = require('../models/Work');
const { saveDAReview, getDAReviewForWork } = require('../utils/database');

// POST /api/da-reviews - District Authority checks feasibility & prohibited status
router.post('/', async (req, res) => {
  try {
    const { workId, feasible, estimatedTimeMonths, prohibited, remarks, reviewedBy } = req.body;

    if (!workId) {
      return res.status(400).json({ success: false, message: 'Work ID is required.' });
    }

    // Persist to unified database engine
    const review = saveDAReview({
      workId,
      feasible,
      estimatedTimeMonths,
      prohibited,
      remarks,
      reviewedBy
    });

    // Also persist to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await DAReview.findOneAndUpdate(
          { workId },
          {
            workId,
            feasible: Boolean(feasible),
            estimatedTimeMonths: Number(estimatedTimeMonths) || 12,
            prohibited: Boolean(prohibited),
            remarks,
            reviewedBy,
            reviewedAt: new Date()
          },
          { upsert: true, new: true }
        );

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

        const newStatus = prohibited ? 'REJECTED' : feasible ? 'SANCTIONED' : 'UNDER_DA_REVIEW';
        const updateObj = { status: newStatus, updatedAt: new Date() };
        if (req.body.sanctionedAmount) {
          updateObj.sanctionedAmount = parseFloat(req.body.sanctionedAmount);
        }
        await Work.findOneAndUpdate(filter, { $set: updateObj });
        if (mongoose.connection.db) {
          await mongoose.connection.db.collection('works').updateOne(filter, { $set: updateObj });
        }
      } catch (dbErr) {
        console.warn('[MongoDB Warning]:', dbErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'District Authority review recorded.',
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/da-reviews/:workId
router.get('/:workId', async (req, res) => {
  try {
    const { workId } = req.params;
    let review = getDAReviewForWork(workId);

    if (!review && mongoose.connection.readyState === 1) {
      review = await DAReview.findOne({ workId });
    }

    if (!review) {
      return res.status(404).json({ success: false, message: 'No DA review found for this Work ID.' });
    }
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
