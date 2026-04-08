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
  body('bookingDetails.adults').isInt({ min: 1, max: 500 }).withMessage('Adults must be between 1 and 500'),
  body('bookingDetails.children').isInt({ min: 0, max: 100 }).withMessage('Children must be between 0 and 100')
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
    // Determine booking type by the presence of checkIn (accommodation-only field),
    // then look in the correct table first to avoid ID collisions between rooms and services.
    const serviceId = req.body.service;
    const isAccommodationRequest = !!(req.body.bookingDetails?.checkIn);
    let service;
    let isRoom = false;

    if (isAccommodationRequest) {
      service = await Room.findByPk(serviceId);
      if (service) isRoom = true;
    }

    if (!service) {
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
      basePrice = service.price * totalGuests;
    }

    console.log(`Creating booking for ${isRoom ? 'Room' : 'Service'} ID: ${service.id}`);
    
    const roomQuantity = parseInt(req.body.roomQuantity) || 1;
    
    const newBooking = await Booking.create({
      serviceId: isRoom ? null : service.id,
      roomId: isRoom ? service.id : null,
      roomQuantity: isRoom ? roomQuantity : 1,
      serviceSnapshot,
      primaryGuest: req.body.primaryGuest,
      additionalGuests: req.body.additionalGuests || [],
      bookingDetails: req.body.bookingDetails,
      specialRequests: req.body.specialRequests || {},
      source: req.body.source || 'website',
      pricing: { basePrice, totalAmount: basePrice, discounts: [], additionalCharges: [] },
    });

    // Update room occupancy if it's a room booking
    if (isRoom) {
      try {
        await service.bookRooms(roomQuantity);
        console.log(`Updated occupancy for room ${service.id}: +${roomQuantity}`);
      } catch (occError) {
        console.error('Failed to update room occupancy:', occError);
        // We continue anyway as the booking is already created
      }
    }

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

    // Handle room occupancy changes based on status transition
    if (booking.roomId && booking.roomQuantity) {
      const isActive = (s) => ['pending', 'confirmed'].includes(s);
      const isInactive = (s) => ['cancelled', 'completed', 'no-show'].includes(s);

      if (isActive(oldStatus) && isInactive(status)) {
        // Releasing rooms
        const room = await Room.findByPk(booking.roomId);
        if (room) {
          try {
            await room.releaseRooms(booking.roomQuantity);
            console.log(`Released ${booking.roomQuantity} room(s) for booking ${booking.bookingReference}`);
          } catch (err) {
            console.error(`Failed to release rooms for booking ${booking.bookingReference}:`, err);
          }
        }
      } else if (isInactive(oldStatus) && isActive(status)) {
        // Re-booking rooms
        const room = await Room.findByPk(booking.roomId);
        if (room) {
          try {
            await room.bookRooms(booking.roomQuantity);
            console.log(`Re-booked ${booking.roomQuantity} room(s) for booking ${booking.bookingReference}`);
          } catch (err) {
            console.error(`Failed to re-book rooms for booking ${booking.bookingReference}:`, err);
            return res.status(400).json({ success: false, message: 'Insufficient rooms available to re-activate this booking' });
          }
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

// @route   PATCH /api/bookings/:id/dates
// @desc    Reschedule booking dates (check-in/check-out or event date)
// @access  Private
router.patch('/:id/dates', auth, async (req, res) => {
  try {
    const { checkIn, checkOut, eventDate } = req.body;

    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (['cancelled', 'completed', 'no-show'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule a booking with status: ' + booking.status });
    }

    const isAccommodation = booking.serviceSnapshot?.category === 'accommodation';
    const oldDetails = { ...booking.bookingDetails };

    if (isAccommodation) {
      if (!checkIn || !checkOut) {
        return res.status(400).json({ success: false, message: 'checkIn and checkOut are required for accommodation bookings' });
      }
      const checkInDate  = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      if (checkOutDate <= checkInDate) {
        return res.status(400).json({ success: false, message: 'Check-out must be after check-in' });
      }
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      booking.bookingDetails = { ...oldDetails, checkIn, checkOut, nights };

      const pricePerNight = parseFloat(booking.serviceSnapshot.price) || 0;
      const newTotal = pricePerNight * nights;
      booking.pricing = { ...booking.pricing, basePrice: newTotal, totalAmount: newTotal };
    } else {
      if (!eventDate) {
        return res.status(400).json({ success: false, message: 'eventDate is required for non-accommodation bookings' });
      }
      booking.bookingDetails = { ...oldDetails, eventDate };
    }

    const currentNotes = booking.notes || [];
    const oldDates = isAccommodation
      ? `${oldDetails.checkIn?.substring(0, 10)} → ${oldDetails.checkOut?.substring(0, 10)}`
      : oldDetails.eventDate?.substring(0, 10);
    const newDates = isAccommodation ? `${checkIn} → ${checkOut}` : eventDate;
    currentNotes.push({
      date: new Date(),
      user: 'admin',
      note: `Dates rescheduled: ${oldDates} to ${newDates}`,
      type: 'reschedule',
    });
    booking.notes = currentNotes;

    await booking.save();

    res.json({ success: true, message: 'Booking dates updated successfully', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while updating dates', error: error.message });
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

    const oldStatus = booking.status;
    const isActive = (s) => ['pending', 'confirmed'].includes(s);

    // Don't actually delete, just mark as cancelled
    booking.status = 'cancelled';

    // Release rooms if it was active and it's a room booking
    if (isActive(oldStatus) && booking.roomId && booking.roomQuantity) {
      const room = await Room.findByPk(booking.roomId);
      if (room) {
        try {
          await room.releaseRooms(booking.roomQuantity);
          console.log(`Released ${booking.roomQuantity} room(s) on deletion for booking ${booking.bookingReference}`);
        } catch (err) {
          console.error(`Failed to release rooms for booking ${booking.bookingReference}:`, err);
        }
      }
    }

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
