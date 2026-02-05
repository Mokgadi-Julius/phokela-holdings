const express = require('express');
const router = express.Router();
const { Expenditure } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

// @route   GET /api/expenditures
// @desc    Get all expenditures with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    const where = {};

    if (category) where.category = category;
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const expenditures = await Expenditure.findAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: expenditures.length,
      data: expenditures
    });
  } catch (error) {
    console.error('Get expenditures error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenditures',
      error: error.message
    });
  }
});

// @route   POST /api/expenditures
// @desc    Create a new expenditure
router.post('/', auth, async (req, res) => {
  try {
    const { title, category, amount, date, description, reference } = req.body;

    if (!title || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Title and amount are required'
      });
    }

    const expenditure = await Expenditure.create({
      title,
      category,
      amount: parseFloat(amount),
      date: date || new Date(),
      description,
      reference
    });

    res.status(201).json({
      success: true,
      message: 'Expenditure recorded successfully',
      data: expenditure
    });
  } catch (error) {
    console.error('Create expenditure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record expenditure',
      error: error.message
    });
  }
});

// @route   DELETE /api/expenditures/:id
// @desc    Delete an expenditure
router.delete('/:id', auth, async (req, res) => {
  try {
    const expenditure = await Expenditure.findByPk(req.params.id);

    if (!expenditure) {
      return res.status(404).json({
        success: false,
        message: 'Expenditure not found'
      });
    }

    await expenditure.destroy();

    res.json({
      success: true,
      message: 'Expenditure deleted successfully'
    });
  } catch (error) {
    console.error('Delete expenditure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expenditure',
      error: error.message
    });
  }
});

module.exports = router;
