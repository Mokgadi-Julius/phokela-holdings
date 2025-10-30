const express = require('express');
const router = express.Router();
const { Service } = require('../models');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for service image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/services');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'service-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Validation middleware
const validateService = [
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Name must be 3-100 characters'),
  body('description').trim().isLength({ min: 3, max: 1000 }).withMessage('Description must be 3-1000 characters'),
  body('category').isIn(['conference', 'catering', 'events']).withMessage('Invalid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('maxPerson').isInt({ min: 1 }).withMessage('Max person must be at least 1')
];

// @route   GET /api/services
// @desc    Get all services
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, available, featured, search, limit = 50, page = 1 } = req.query;

    let where = {};

    if (category) where.category = category;
    if (available !== undefined) where.availability = available === 'true';
    if (featured !== undefined) where.featured = featured === 'true';

    // Removed minPerson filter as it's not defined in query params

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Service.findAndCountAll({
      where,
      order: [['featured', 'DESC'], ['price', 'ASC']],
      offset,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching services',
      error: error.message
    });
  }
});

// @route   POST /api/services/upload-images
// @desc    Upload service images
// @access  Private (Admin only)
router.post('/upload-images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const imageUrls = req.files.map(file =>
      `/uploads/services/${file.filename}`
    );

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        imageUrls,
        count: imageUrls.length
      }
    });
  } catch (error) {
    console.error('Upload service images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

// @route   GET /api/services/category/:category
// @desc    Get services by category
// @access  Public
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    // Validate category
    const validCategories = ['conference', 'catering', 'events'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Valid categories: ' + validCategories.join(', ')
      });
    }

    const services = await Service.findAll({
      where: {
        category,
        availability: true
      },
      order: [
        ['featured', 'DESC'],
        ['price', 'ASC']
      ]
    });

    res.json({
      success: true,
      data: services,
      count: services.length
    });
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching services by category',
      error: error.message
    });
  }
});

// @route   PATCH /api/services/:id/availability
// @desc    Toggle service availability
// @access  Private (Admin only)
router.patch('/:id/availability', async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    service.availability = !service.availability;
    await service.save();

    res.json({
      success: true,
      data: service,
      message: `Service ${service.availability ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Toggle service availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle service availability',
      error: error.message
    });
  }
});

// @route   GET /api/services/:id
// @desc    Get service by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching service',
      error: error.message
    });
  }
});

// @route   POST /api/services
// @desc    Create new service
// @access  Private (Admin only)
router.post('/', validateService, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const service = await Service.create(req.body);

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating service',
      error: error.message
    });
  }
});

// @route   PUT /api/services/:id
// @desc    Update service by ID
// @access  Private (Admin only)
router.put('/:id', validateService, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const updatedService = await service.update(req.body);

    res.json({
      success: true,
      data: updatedService
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating service',
      error: error.message
    });
  }
});

// @route   DELETE /api/services/:id
// @desc    Delete service by ID
// @access  Private (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await service.destroy();

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting service',
      error: error.message
    });
  }
});

module.exports = router;
