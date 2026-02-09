const { sequelize } = require('../config/database-mysql');
const { Op } = require('sequelize');
const express = require('express');
const router = express.Router();
const { Booking, Service, Room } = require('../models');
const { body, validationResult } = require('express-validator');
const sendEmail = require('../utils/emailService');
const auth = require('../middleware/auth');

// Validation middleware
const validateBooking = [
  body('service').isNumeric().withMessage('Valid service ID is required'),
  body('primaryGuest.firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('primaryGuest.lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('primaryGuest.email').isEmail().withMessage('Valid email is required'),
  body('primaryGuest.phone').isMobilePhone('any').withMessage('Valid phone number is required'),
  body('bookingDetails.adults').isInt({ min: 1, max: 200 }).withMessage('Adults must be 1-200'),
  body('bookingDetails.children').isInt({ min: 0, max: 50 }).withMessage('Children must be 0-50')
];

// @route   GET /api/bookings
// @desc    Get all bookings (Admin only)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      status,
      serviceId,
      category,
      dateFrom,
      dateTo,
      limit = 50,
      page = 1,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    let where = {};

    if (status) where.status = status;
    if (serviceId) where.serviceId = serviceId;

    if (category) {
      where['$service.category$'] = category; // Querying association
    }

    if (dateFrom || dateTo) {
      const dateQuery = {};
      if (dateFrom) dateQuery[Op.gte] = new Date(dateFrom);
      if (dateTo) dateQuery[Op.lte] = new Date(dateTo);

      where[Op.or] = [
        { 'bookingDetails.checkIn': dateQuery },
        { 'bookingDetails.eventDate': dateQuery }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [{
        model: Service,
        as: 'service',
        attributes: ['name', 'category', 'images']
      }],
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
      message: 'Server error while fetching bookings',
      error: error.message
    });
  }
});

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Public
router.post('/', validateBooking, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
  }

  try {
    // Check if this is a room (accommodation) or service booking
    const serviceId = req.body.service;
    const bookingType = req.body.bookingType || (req.body.serviceSnapshot?.category === 'accommodation' ? 'room' : 'service');

    let service;
    let isRoom = false;

    if (bookingType === 'room' || bookingType === 'accommodation') {
      // It's a room booking
      service = await Room.findByPk(serviceId);
      isRoom = true;
    } else {
      // It's a service booking (catering, events, etc.)
      service = await Service.findByPk(serviceId);
      isRoom = false;
    }

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (!service.availability) {
      return res.status(400).json({ success: false, message: 'Service is currently unavailable' });
    }

    const totalGuests = req.body.bookingDetails.adults + req.body.bookingDetails.children;
    const maxCapacity = isRoom ? service.capacity : service.maxPerson;
    if (totalGuests > maxCapacity) {
      return res.status(400).json({ success: false, message: `Maximum ${maxCapacity} guests allowed` });
    }

    // Build service snapshot
    const category = isRoom ? 'accommodation' : service.category;
    const priceUnit = isRoom ? 'per night' : service.priceUnit;
    const serviceSnapshot = {
      name: service.name,
      price: service.price,
      priceUnit,
      category
    };

    // Calculate base price
    let basePrice = parseFloat(service.price);
    if (category === 'accommodation') {
      const checkIn = new Date(req.body.bookingDetails.checkIn);
      const checkOut = new Date(req.body.bookingDetails.checkOut);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      basePrice = service.price * (nights > 0 ? nights : 1);
    } else if (category === 'catering') {
      // Check if price is per person or fixed
      const isPerPerson = service.priceUnit && (
        service.priceUnit.toLowerCase().includes('person') ||
        service.priceUnit.toLowerCase().includes('guest') ||
        service.priceUnit.toLowerCase().includes('pp') ||
        service.priceUnit.toLowerCase().includes('head')
      );

      if (isPerPerson) {
        basePrice = service.price * totalGuests;
      } else {
        basePrice = service.price;
      }
    }

    // Generate booking reference
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await Booking.count({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(3, '0');
    const bookingReference = `PH${year}${month}${day}${sequence}`;

    console.log('Generated bookingReference:', bookingReference);
    console.log('Type of bookingReference:', typeof bookingReference);

    const newBooking = await Booking.create({
      bookingReference,
      // If it's a room booking, set roomId and leave serviceId null (if allowed) or handle properly
      // Note: serviceId must be nullable in the DB for this to work perfectly without a dummy service
      serviceId: isRoom ? null : service.id,
      roomId: isRoom ? service.id : null,
      serviceSnapshot,
      primaryGuest: req.body.primaryGuest,
      additionalGuests: req.body.additionalGuests || [],
      bookingDetails: req.body.bookingDetails,
      specialRequests: req.body.specialRequests || {},
      source: req.body.source || 'website',
      pricing: { basePrice, totalAmount: basePrice, discounts: [], additionalCharges: [] },
    });

    // Send confirmation email
    try {
      await sendEmail({
        to: newBooking.primaryGuest.email,
        subject: `Booking Confirmation - ${newBooking.bookingReference}`,
        template: 'booking-confirmation',
        data: { booking: newBooking.toJSON(), service: service.toJSON() }
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.status(201).json({ success: true, message: 'Booking created successfully', data: newBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while creating booking', error: error.message });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{
        model: Service,
        as: 'service',
        attributes: ['name', 'category', 'images', 'price']
      }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking',
      error: error.message
    });
  }
});

// @route   PATCH /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const oldStatus = booking.status;
    booking.status = status;

    // Release rooms if booking is being completed or cancelled and it's a room booking
    if ((status === 'completed' || status === 'cancelled') && booking.roomId && booking.roomQuantity) {
      const room = await Room.findByPk(booking.roomId);
      if (room) {
        try {
          await room.releaseRooms(booking.roomQuantity);
          console.log(`Released ${booking.roomQuantity} room(s) for booking ${booking.bookingReference}`);
        } catch (err) {
          console.error(`Failed to release rooms for booking ${booking.bookingReference}:`, err);
        }
      }
    }

    // Add note to communication array
    if (notes || oldStatus !== status) {
      const currentNotes = booking.notes || [];
      currentNotes.push({
        date: new Date(),
        user: 'admin',
        note: notes || `Status changed from ${oldStatus} to ${status}${(status === 'completed' || status === 'cancelled') && booking.roomQuantity ? ` - ${booking.roomQuantity} room(s) released` : ''}`,
        type: 'status_change'
      });
      booking.notes = currentNotes;
    }

    await booking.save();

    // Send email notification to guest
    if (oldStatus !== status) {
      try {
        await sendEmail({
          to: booking.primaryGuest.email,
          subject: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)} - ${booking.bookingReference}`,
          template: 'booking-status-update',
          data: { booking: booking.toJSON(), oldStatus, newStatus: status }
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking status',
      error: error.message
    });
  }
});

// @route   PATCH /api/bookings/:id/payment
// @desc    Update payment status
// @access  Private
router.patch('/:id/payment', auth, async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, amount, reference } = req.body;

    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const validStatuses = ['pending', 'deposit-paid', 'fully-paid', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    booking.paymentStatus = paymentStatus;

    // Update payment details
    const paymentDetails = booking.paymentDetails || {};
    if (!paymentDetails.transactions) {
      paymentDetails.transactions = [];
    }

    paymentDetails.transactions.push({
      date: new Date(),
      status: paymentStatus,
      method: paymentMethod,
      amount,
      reference,
      processedBy: 'admin'
    });

    booking.paymentDetails = paymentDetails;
    await booking.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment status',
      error: error.message
    });
  }
});

// @route   POST /api/bookings/:id/notes
// @desc    Add note to booking
// @access  Private
router.post('/:id/notes', auth, async (req, res) => {
  try {
    const { note, type = 'general' } = req.body;

    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const currentNotes = booking.notes || [];
    currentNotes.push({
      date: new Date(),
      user: 'admin',
      note,
      type
    });

    booking.notes = currentNotes;
    await booking.save();

    res.json({
      success: true,
      message: 'Note added successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while adding note',
      error: error.message
    });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete/Cancel booking
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Don't actually delete, just mark as cancelled
    booking.status = 'cancelled';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling booking',
      error: error.message
    });
  }
});

module.exports = router;
