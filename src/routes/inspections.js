const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Inspection = require('../models/Inspection');
const Work = require('../models/Work');
const Report = require('../models/Report');
const { createInspection, getInspectionsForWork } = require('../utils/database');

// POST /api/inspections - Implementing Agency submits 30-day inspection
router.post('/', async (req, res) => {
  try {
    const { workId, iaId, progressPercentage, remarks, reportingPeriod } = req.body;

    if (!workId || progressPercentage === undefined) {
      return res.status(400).json({ success: false, message: 'Work ID and progress percentage are required.' });
    }

    // Persist to unified database engine
    const { inspection, report } = createInspection({
      workId,
      iaId,
      progressPercentage,
      remarks,
      reportingPeriod
    });

    // Also persist to MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const mongoInsp = new Inspection({
          workId,
          iaId: iaId || 'IA-OFFICER-FIELD',
          progressPercentage: Number(progressPercentage),
          remarks: remarks || ''
        });
        await mongoInsp.save();

        const mongoReport = new Report({
          reportId: report.reportId,
          workId,
          inspectionId: mongoInsp._id,
          reportingPeriod: inspection.reportingPeriod,
          remarks: report.remarks
        });
        await mongoReport.save();

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

        const updatedStatus = Number(progressPercentage) >= 100 ? 'COMPLETED' : 'IN_PROGRESS';
        const updateObj = {
          physicalProgress: Number(progressPercentage),
          status: updatedStatus,
          updatedAt: new Date()
        };
        if (Number(progressPercentage) >= 100) {
          updateObj.actualCompletionDate = new Date();
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
      message: '30-day inspection and report created successfully.',
      inspection,
      report
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/inspections/:workId - Inspection timeline
router.get('/:workId', async (req, res) => {
  try {
    const { workId } = req.params;
    let inspections = getInspectionsForWork(workId);

    if ((!inspections || inspections.length === 0) && mongoose.connection.readyState === 1) {
      inspections = await Inspection.find({ workId })
        .populate('photos')
        .sort({ inspectionDate: -1 });
    }

    res.json({
      success: true,
      count: inspections.length,
      data: inspections
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
