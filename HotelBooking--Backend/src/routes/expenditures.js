const express = require('express');
const router = express.Router();
const { Expenditure } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { calculateNextDueDate } = require('../schedulers/recurringExpenses');

// @route   GET /api/expenditures/templates
// @desc    Get all recurring expense templates
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = await Expenditure.findAll({
      where: { isRecurring: true },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates', error: error.message });
  }
});

// @route   POST /api/expenditures/templates/trigger
// @desc    Manually run all due recurring templates now
router.post('/templates/trigger', auth, async (req, res) => {
  try {
    const { processRecurringExpenses } = require('../schedulers/recurringExpenses');
    await processRecurringExpenses();
    res.json({ success: true, message: 'Recurring expenses processed' });
  } catch (error) {
    console.error('Trigger recurring error:', error);
    res.status(500).json({ success: false, message: 'Failed to trigger recurring expenses', error: error.message });
  }
});

// @route   POST /api/expenditures/templates/:id/trigger
// @desc    Force-generate the next occurrence for a specific template now
router.post('/templates/:id/trigger', auth, async (req, res) => {
  try {
    const template = await Expenditure.findOne({ where: { id: req.params.id, isRecurring: true } });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Recurring template not found' });
    }
    const today = new Date().toISOString().split('T')[0];
    const generated = await Expenditure.create({
      title: template.title,
      category: template.category,
      amount: template.amount,
      date: today,
      description: template.description,
      reference: template.reference,
      isRecurring: false,
      recurringFrequency: null,
      nextDueDate: null,
    });
    await template.update({ nextDueDate: calculateNextDueDate(today, template.recurringFrequency) });
    res.json({ success: true, message: 'Expense generated', data: generated });
  } catch (error) {
    console.error('Trigger template error:', error);
    res.status(500).json({ success: false, message: 'Failed to trigger template', error: error.message });
  }
});

// @route   PATCH /api/expenditures/templates/:id/pause
// @desc    Toggle pause/resume for a recurring template
router.patch('/templates/:id/pause', auth, async (req, res) => {
  try {
    const template = await Expenditure.findOne({ where: { id: req.params.id, isRecurring: true } });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Recurring template not found' });
    }
    await template.update({ isPaused: !template.isPaused });
    res.json({
      success: true,
      message: template.isPaused ? 'Template paused' : 'Template resumed',
      data: template,
    });
  } catch (error) {
    console.error('Pause template error:', error);
    res.status(500).json({ success: false, message: 'Failed to update template', error: error.message });
  }
});

// @route   GET /api/expenditures/summary
// @desc    Expenditure summary stats (totals by period and category)
router.get('/summary', auth, async (req, res) => {
  try {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    const thisMonthStart = new Date(y, m, 1);
    const thisMonthEnd   = new Date(y, m + 1, 0, 23, 59, 59, 999);
    const lastMonthStart = new Date(y, m - 1, 1);
    const lastMonthEnd   = new Date(y, m, 0, 23, 59, 59, 999);
    const ytdStart       = new Date(y, 0, 1);
    const ytdEnd         = new Date(y, 11, 31, 23, 59, 59, 999);

    const [total, thisMonth, lastMonth, ytd] = await Promise.all([
      Expenditure.sum('amount'),
      Expenditure.sum('amount', { where: { date: { [Op.between]: [thisMonthStart, thisMonthEnd] } } }),
      Expenditure.sum('amount', { where: { date: { [Op.between]: [lastMonthStart, lastMonthEnd] } } }),
      Expenditure.sum('amount', { where: { date: { [Op.between]: [ytdStart, ytdEnd] } } }),
    ]);

    // Breakdown by category for current month
    const { sequelize: seq } = require('../config/database-mysql');
    const byCategory = await Expenditure.findAll({
      attributes: ['category', [seq.fn('SUM', seq.col('amount')), 'total']],
      where: { date: { [Op.between]: [thisMonthStart, thisMonthEnd] } },
      group: ['category'],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        allTime:   parseFloat(total)     || 0,
        thisMonth: parseFloat(thisMonth) || 0,
        lastMonth: parseFloat(lastMonth) || 0,
        ytd:       parseFloat(ytd)       || 0,
        byCategory,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/expenditures/upload
// @desc    Upload a receipt image for an expenditure
router.post('/upload', auth, async (req, res) => {
  const { upload } = require('../config/cloudinary');
  upload.single('receipt')(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.json({
      success: true,
      data: { url: req.file.path },
    });
  });
});

// @route   GET /api/expenditures/:id
// @desc    Get a single expenditure by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const expenditure = await Expenditure.findByPk(req.params.id);
    if (!expenditure) return res.status(404).json({ success: false, message: 'Expenditure not found' });
    res.json({ success: true, data: expenditure });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/expenditures
// @desc    Get all expenditures with filtering
router.get('/', auth, async (req, res) => {
  try {
    const {
      category, startDate, endDate,
      search,
      sortBy = 'date', sortOrder = 'DESC',
      page = 1, limit = 10,
    } = req.query;
    const where = {};

    if (category) where.category = category;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    if (search) {
      where[Op.or] = [
        { title:       { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { reference:   { [Op.like]: `%${search}%` } },
      ];
    }

    const allowedSort = ['date', 'amount', 'title', 'category', 'createdAt'];
    const orderCol = allowedSort.includes(sortBy) ? sortBy : 'date';
    const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: expenditures } = await Expenditure.findAndCountAll({
      where,
      order: [[orderCol, orderDir]],
      limit: limitNum,
      offset
    });

    const globalTotal = (await Expenditure.sum('amount')) || 0;
    const filteredTotal = (await Expenditure.sum('amount', { where })) || 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const ytdStart = new Date(currentYear, 0, 1);
    const ytdEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const thisMonthTotal = (await Expenditure.sum('amount', {
      where: { date: { [Op.gte]: thisMonthStart, [Op.lte]: thisMonthEnd } }
    })) || 0;

    const lastMonthTotal = (await Expenditure.sum('amount', {
      where: { date: { [Op.gte]: lastMonthStart, [Op.lte]: lastMonthEnd } }
    })) || 0;

    const ytdTotal = (await Expenditure.sum('amount', {
      where: { date: { [Op.gte]: ytdStart, [Op.lte]: ytdEnd } }
    })) || 0;

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      globalTotal,
      filteredTotal,
      thisMonthTotal,
      lastMonthTotal,
      ytdTotal,
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
    const { title, category, amount, date, description, reference, isRecurring, recurringFrequency } = req.body;

    if (!title || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Title and amount are required'
      });
    }

    const expenseDate = date || new Date().toISOString().split('T')[0];
    const expenditure = await Expenditure.create({
      title,
      category,
      amount: parseFloat(amount),
      date: expenseDate,
      description,
      reference,
      isRecurring: !!isRecurring,
      recurringFrequency: isRecurring ? (recurringFrequency || null) : null,
      nextDueDate: isRecurring ? calculateNextDueDate(expenseDate, recurringFrequency) : null,
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

// @route   PUT /api/expenditures/:id
// @desc    Update an expenditure
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, category, amount, date, description, reference, isRecurring, recurringFrequency } = req.body;

    const expenditure = await Expenditure.findByPk(req.params.id);

    if (!expenditure) {
      return res.status(404).json({
        success: false,
        message: 'Expenditure not found'
      });
    }

    if (title !== undefined) expenditure.title = title;
    if (category !== undefined) expenditure.category = category;
    if (amount !== undefined) expenditure.amount = parseFloat(amount);
    if (date !== undefined) expenditure.date = date;
    if (description !== undefined) expenditure.description = description;
    if (reference !== undefined) expenditure.reference = reference;
    if (isRecurring !== undefined) {
      expenditure.isRecurring = !!isRecurring;
      expenditure.recurringFrequency = isRecurring ? (recurringFrequency || null) : null;
      const baseDate = (date !== undefined ? date : expenditure.date);
      expenditure.nextDueDate = isRecurring
        ? calculateNextDueDate(baseDate, recurringFrequency || expenditure.recurringFrequency)
        : null;
    } else if (date !== undefined && expenditure.isRecurring) {
      // If only the date changed, recalculate nextDueDate
      expenditure.nextDueDate = calculateNextDueDate(date, expenditure.recurringFrequency);
    }

    await expenditure.save();

    res.json({
      success: true,
      message: 'Expenditure updated successfully',
      data: expenditure
    });
  } catch (error) {
    console.error('Update expenditure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expenditure',
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
