const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Work = require('../models/Work');
const MP = require('../models/MP');
const State = require('../models/State');
const { getNationalOverview, getStates, getWorks, getMPs } = require('../utils/datasetLoader');

// GET /api/analytics/overview - High-level national metrics
router.get('/overview', async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    // Use official dataset from dataset folder
    const officialOverview = getNationalOverview();
    if (officialOverview) {
      return res.json({
        success: true,
        source: 'official-government-dataset',
        data: {
          totalMPs: officialOverview.totalMPs,
          totalWorks: officialOverview.totalWorksRecommended,
          completedWorks: officialOverview.totalWorksCompleted,
          pendingWorks: officialOverview.pendingWorks,
          completionRate: Number(officialOverview.completionRate.toFixed(1)),
          totalSanctioned: officialOverview.totalAllocated,
          totalDisbursed: officialOverview.totalExpenditure,
          avgUtilization: Number(officialOverview.utilizationPercentage.toFixed(1)),
          totalTransactions: officialOverview.totalTransactions,
          completedWorksValue: officialOverview.completedWorksValue,
          inProgressPayments: officialOverview.inProgressPayments
        }
      });
    }

    if (!isDbConnected) {
      const works = getWorks();
      const mps = getMPs();
      return res.json({
        success: true,
        source: 'fallback',
        data: {
          totalMPs: mps.length || 774,
          totalWorks: works.length || 6000,
          completedWorks: works.filter(w => w.status === 'COMPLETED').length,
          pendingWorks: works.filter(w => w.status !== 'COMPLETED').length,
          totalSanctioned: 116819035627,
          totalDisbursed: 39847655097,
          avgUtilization: 34.1
        }
      });
    }

    const totalMPs = await MP.countDocuments();
    const totalWorks = await Work.countDocuments();
    const completedWorks = await Work.countDocuments({ status: 'COMPLETED' });

    const financials = await Work.aggregate([
      {
        $group: {
          _id: null,
          totalSanctioned: { $sum: '$sanctionedAmount' },
          totalDisbursed: { $sum: '$disbursedAmount' }
        }
      }
    ]);

    const totalSanctioned = financials[0]?.totalSanctioned || 0;
    const totalDisbursed = financials[0]?.totalDisbursed || 0;

    res.json({
      success: true,
      source: 'mongodb',
      data: {
        totalMPs,
        totalWorks,
        completedWorks,
        pendingWorks: totalWorks - completedWorks,
        totalSanctioned,
        totalDisbursed,
        avgUtilization: totalSanctioned > 0 ? Number(((totalDisbursed / totalSanctioned) * 100).toFixed(1)) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/analytics/compare - Comparison
router.get('/compare', async (req, res) => {
  try {
    const { type, items } = req.query;
    const allStates = getStates();

    if (type === 'state') {
      const itemList = items ? items.split(',').map(s => s.trim().toLowerCase()) : [];
      let selectedStates = allStates;
      if (itemList.length > 0) {
        selectedStates = allStates.filter(s =>
          itemList.some(item => s.name.toLowerCase().includes(item))
        );
      }
      if (selectedStates.length === 0) {
        selectedStates = allStates.slice(0, 8); // Top 8 states
      }

      return res.json({
        success: true,
        source: 'official-dataset',
        type: 'state',
        data: selectedStates.map(s => ({
          name: s.name,
          totalMPs: s.totalMPs,
          allocatedAmount: s.allocatedAmount,
          utilizedAmount: s.utilizedAmount,
          utilizationPercentage: s.utilizationPercentage,
          worksCompleted: s.worksCompleted,
          worksPending: s.worksPending
        }))
      });
    }

    // Default: Category comparison aggregated from real works
    const works = getWorks();
    const catAgg = {};

    works.forEach(w => {
      const cat = w.category || 'Other';
      if (!catAgg[cat]) {
        catAgg[cat] = { _id: cat, totalWorks: 0, totalSanctioned: 0, totalDisbursed: 0, completed: 0 };
      }
      catAgg[cat].totalWorks += 1;
      catAgg[cat].totalSanctioned += (w.sanctionedAmount || 0);
      catAgg[cat].totalDisbursed += (w.disbursedAmount || 0);
      if (w.status === 'COMPLETED') catAgg[cat].completed += 1;
    });

    const categoryList = Object.values(catAgg).sort((a, b) => b.totalWorks - a.totalWorks);

    res.json({
      success: true,
      source: 'official-dataset',
      type: 'category',
      data: categoryList
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
