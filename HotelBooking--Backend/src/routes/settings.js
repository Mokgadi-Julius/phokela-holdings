const express = require('express');
const router = express.Router();
const { Setting } = require('../models');
const auth = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get all settings
router.get('/', auth, async (req, res) => {
  try {
    const settings = await Setting.findAll();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json({ success: true, data: settingsMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/settings/:group
// @desc    Get settings by group
router.get('/:group', auth, async (req, res) => {
  try {
    const settings = await Setting.findAll({ where: { group: req.params.group } });
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json({ success: true, data: settingsMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/settings
// @desc    Update or create settings (bulk)
router.post('/', auth, async (req, res) => {
  try {
    const { settings, group } = req.body; // settings: { key: value, ... }
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'Settings object is required' });
    }

    const updatePromises = Object.entries(settings).map(([key, value]) => {
      return Setting.upsert({
        key,
        value,
        group: group || 'general'
      });
    });

    await Promise.all(updatePromises);

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
