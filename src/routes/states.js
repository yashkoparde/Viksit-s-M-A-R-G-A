const express = require('express');
const router = express.Router();
const { getStates } = require('../utils/datasetLoader');

// GET /api/states - State-wise performance ranking & summary for all 36 States & UTs
router.get('/', async (req, res) => {
  try {
    const states = getStates();
    const { sortBy = 'utilizationPercentage', order = 'desc', search } = req.query;

    let result = [...states];
    if (search) {
      result = result.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    }

    result.sort((a, b) => {
      if (order === 'asc') {
        return (a[sortBy] || 0) > (b[sortBy] || 0) ? 1 : -1;
      }
      return (a[sortBy] || 0) < (b[sortBy] || 0) ? 1 : -1;
    });

    res.json({
      success: true,
      source: 'official-dataset',
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/states/:stateId - Drill down into specific State
router.get('/:stateId', async (req, res) => {
  try {
    const states = getStates();
    const query = req.params.stateId.toLowerCase();
    const state = states.find(s =>
      s.stateId.toLowerCase() === query ||
      s.name.toLowerCase() === query
    );

    if (!state) {
      return res.status(404).json({ success: false, message: 'State not found.' });
    }

    res.json({
      success: true,
      source: 'official-dataset',
      data: state
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
