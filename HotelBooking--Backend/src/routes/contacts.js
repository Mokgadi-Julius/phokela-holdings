const express = require('express');
const router = express.Router();
const { Contact } = require('../models');
const { body, validationResult } = require('express-validator');
const sendEmail = require('../utils/emailService');
const { Op } = require('sequelize');

// Validation middleware
const validateContact = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be 10-1000 characters'),
  body('service').optional().isIn(['accommodation', 'catering', 'conference', 'events', 'corporate', 'other']).withMessage('Invalid service type')
];

// @route   GET /api/contacts
// @desc    Get all contacts (Admin only)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      status,
      service,
      priority,
      assignedTo,
      dateFrom,
      dateTo,
      limit = 50,
      page = 1,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    let where = {};

    if (status) where.status = status;
    if (service) where.service = service;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Contact.findAndCountAll({
      where,
      order: [[sortBy, order.toUpperCase()]],
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
      message: 'Server error while fetching contacts',
      error: error.message
    });
  }
});

// @route   POST /api/contacts
// @desc    Create new contact submission
// @access  Public
router.post('/', validateContact, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const contact = await Contact.create(req.body);

    // Send auto-reply email to customer
    try {
      await sendEmail({
        to: contact.email,
        subject: 'Thank you for contacting Phokela Guest House',
        template: 'contact-auto-reply',
        data: { contact: contact.toJSON() }
      });

      // Send notification email to admin
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@phokelaholdings.co.za',
        subject: `New Contact Form Submission - ${contact.service}`,
        template: 'contact-notification',
        data: { contact: contact.toJSON() }
      });
    } catch (emailError) {
      console.error('Failed to send contact emails:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully. We will get back to you soon!',
      data: {
        id: contact.id,
        status: contact.status,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while submitting contact form',
      error: error.message
    });
  }
});

// Other routes from original file would go here, refactored for Sequelize

module.exports = router;
