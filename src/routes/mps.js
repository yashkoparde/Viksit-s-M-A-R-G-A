const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MP = require('../models/MP');
const { getMPs } = require('../utils/datasetLoader');

function toNum(val, fallback = 0) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return val;
  if (val && typeof val.toString === 'function') {
    const parsed = parseFloat(val.toString());
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function normalizeMongoMP(m, index = 0) {
  if (!m) return null;
  const raw = m.toObject ? m.toObject() : m;
  const allocated = toNum(raw.allocatedAmount || raw.allocatedFunds, 50000000);
  const expenditure = toNum(raw.totalExpenditure || raw.utilizedFunds, 0);
  const unspent = toNum(raw.unspentAmount, Math.max(0, allocated - expenditure));
  const utilRate = toNum(raw.utilizationPercentage || raw.utilizationRate, allocated > 0 ? (expenditure / allocated) * 100 : 0);
  const name = raw.mpName || raw.name || 'Member of Parliament';

  let tier = 'Average Performer';
  if (utilRate >= 75) tier = 'High Performer';
  else if (utilRate < 50) tier = 'Needs Improvement';

  return {
    _id: raw._id,
    mpId: raw.mpId || `MP-${String(index + 1).padStart(4, '0')}`,
    name,
    mpName: name,
    constituency: raw.constituency || 'General',
    state: raw.state || 'National',
    house: raw.house || 'Lok Sabha',
    allocatedFunds: allocated,
    allocatedAmount: allocated,
    utilizedFunds: expenditure,
    totalExpenditure: expenditure,
    unspentAmount: unspent,
    utilizationRate: Number(utilRate.toFixed(2)),
    utilizationPercentage: Number(utilRate.toFixed(2)),
    completedWorks: raw.completedWorksCount !== undefined ? raw.completedWorksCount : (raw.completedWorks || 0),
    recommendedWorks: raw.recommendedWorksCount !== undefined ? raw.recommendedWorksCount : (raw.recommendedWorks || 0),
    completionRate: toNum(raw.completionRatePercentage || raw.completionRate, 0),
    transactionCount: raw.transactionCount || 0,
    tier
  };
}

// GET /api/mps - List MPs (774 official MPs)
router.get('/', async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const { tier, search, house, state, limit = 50, page = 1 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));

    let list = [];

    // If MongoDB is connected, load from MongoDB Atlas
    if (isDbConnected) {
      try {
        const mongoQuery = {};
        if (house) mongoQuery.house = { $regex: new RegExp(house, 'i') };
        if (state) mongoQuery.state = { $regex: new RegExp(state, 'i') };
        if (search) {
          const q = search.trim();
          mongoQuery.$or = [
            { mpName: { $regex: new RegExp(q, 'i') } },
            { name: { $regex: new RegExp(q, 'i') } },
            { constituency: { $regex: new RegExp(q, 'i') } },
            { state: { $regex: new RegExp(q, 'i') } }
          ];
        }

        const mongoMPs = await MP.find(mongoQuery).lean();
        if (mongoMPs && mongoMPs.length > 0) {
          list = mongoMPs.map((m, idx) => normalizeMongoMP(m, idx));
        }
      } catch (dbErr) {
        console.warn('[MongoDB MPs Warning]:', dbErr.message);
      }
    }

    // Fallback to in-memory dataset loader
    if (!list || list.length === 0) {
      list = getMPs();
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(m =>
          m.name.toLowerCase().includes(q) ||
          m.constituency.toLowerCase().includes(q) ||
          m.state.toLowerCase().includes(q) ||
          m.mpId.toLowerCase().includes(q)
        );
      }
      if (house) {
        list = list.filter(m => m.house.toLowerCase() === house.toLowerCase());
      }
      if (state) {
        list = list.filter(m => m.state.toLowerCase().includes(state.toLowerCase()));
      }
    }

    if (tier && tier !== 'all') {
      list = list.filter(m => m.tier.toLowerCase() === tier.toLowerCase());
    }

    const total = list.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = list.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      source: isDbConnected ? 'mongodb-atlas' : 'official-dataset',
      cluster: 'Cluster0 (mplads_db)',
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      count: paginated.length,
      data: paginated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/mps/:mpId - Single MP details
router.get('/:mpId', async (req, res) => {
  try {
    const { mpId } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;
    let mp = null;

    if (isDbConnected) {
      try {
        const q = String(mpId).trim();
        const found = await MP.findOne({
          $or: [
            { mpId: q },
            { mpName: { $regex: new RegExp(q, 'i') } },
            { constituency: { $regex: new RegExp(q, 'i') } }
          ]
        }).lean();
        if (found) {
          mp = normalizeMongoMP(found);
        }
      } catch (err) {
        console.warn('[MongoDB MP Detail Warning]:', err.message);
      }
    }

    if (!mp) {
      const list = getMPs();
      mp = list.find(m =>
        m.mpId.toLowerCase() === mpId.toLowerCase() ||
        m.name.toLowerCase().includes(mpId.toLowerCase()) ||
        m.constituency.toLowerCase().includes(mpId.toLowerCase())
      );
    }

    if (!mp) {
      return res.status(404).json({ success: false, message: `MP '${mpId}' not found.` });
    }

    res.json({
      success: true,
      source: isDbConnected ? 'mongodb-atlas' : 'official-dataset',
      data: {
        mp,
        portfolio: {
          totalWorks: (mp.completedWorks || 0) + (mp.recommendedWorks || 0),
          completedWorks: mp.completedWorks || 0,
          pendingWorks: mp.recommendedWorks || 0,
          utilizationPercentage: mp.utilizationRate || mp.utilizationPercentage,
          allocatedFunds: mp.allocatedFunds,
          utilizedFunds: mp.utilizedFunds,
          unspentFunds: mp.unspentAmount,
          transactions: mp.transactionCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
