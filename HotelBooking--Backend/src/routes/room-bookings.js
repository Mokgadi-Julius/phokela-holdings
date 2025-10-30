const express = require('express');
const router = express.Router();
const { Booking, Room } = require('../models');
const { body, validationResult } = require('express-validator');
const sendEmail = require('../utils/emailService');
const { Op } = require('sequelize');

// Generate unique booking reference
const generateBookingReference = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `BK-${dateStr}-${random}`;
};

// Validation middleware for room bookings
const validateRoomBooking = [
  body('roomId').isInt().withMessage('Valid room ID is required'),
  body('roomQuantity').isInt({ min: 1, max: 10 }).withMessage('Room quantity must be between 1-10'),
  body('primaryGuest.firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('primaryGuest.lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('primaryGuest.email').isEmail().withMessage('Valid email is required'),
  body('primaryGuest.phone').isMobilePhone('any').withMessage('Valid phone number is required'),
  body('bookingDetails.checkIn').isISO8601().withMessage('Valid check-in date is required'),
  body('bookingDetails.checkOut').isISO8601().withMessage('Valid check-out date is required'),
  body('bookingDetails.adults').isInt({ min: 1, max: 20 }).withMessage('Adults must be 1-20'),
  body('bookingDetails.children').optional().isInt({ min: 0, max: 10 }).withMessage('Children must be 0-10')
];

// @route   POST /api/bookings/rooms
// @desc    Create new room booking
// @access  Public
router.post('/', validateRoomBooking, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const { roomId, roomQuantity, primaryGuest, bookingDetails, specialRequests } = req.body;

    // Validate check-in/check-out times
    const checkIn = new Date(bookingDetails.checkIn);
    const checkOut = new Date(bookingDetails.checkOut);

    // Check-out time must be 10pm (22:00)
    const checkOutHour = checkOut.getHours();
    if (checkOutHour !== 22) {
      checkOut.setHours(22, 0, 0, 0);
    }

    // Validate dates
    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }

    // Find the room
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check availability
    if (!room.isAvailable(roomQuantity)) {
      return res.status(400).json({
        success: false,
        message: `Only ${room.getAvailableQuantity()} room(s) available. You requested ${roomQuantity}.`,
        available: room.getAvailableQuantity()
      });
    }

    // Calculate nights and pricing
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const basePrice = room.price * nights * roomQuantity;
    const totalAmount = basePrice;

    // Generate booking reference
    const bookingReference = generateBookingReference();

    // Create booking
    const newBooking = await Booking.create({
      bookingReference,
      roomId: room.id,
      serviceId: null,
      roomQuantity,
      primaryGuest,
      additionalGuests: [],
      bookingDetails: {
        ...bookingDetails,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        nights,
        roomType: room.type,
        roomName: room.name
      },
      pricing: {
        basePrice,
        totalAmount,
        pricePerNight: room.price,
        numberOfNights: nights,
        numberOfRooms: roomQuantity,
        discounts: [],
        additionalCharges: []
      },
      specialRequests: specialRequests || {},
      serviceSnapshot: {
        name: room.name,
        price: room.price,
        priceUnit: 'per night',
        category: 'accommodation',
        type: room.type
      }
    });

    // Update room availability
    await room.bookRooms(roomQuantity);

    // Send confirmation email
    try {
      await sendEmail({
        to: newBooking.primaryGuest.email,
        subject: `Room Booking Confirmation - ${newBooking.bookingReference}`,
        template: 'booking-confirmation',
        data: {
          booking: newBooking.toJSON(),
          room: room.toJSON(),
          checkInTime: 'Anytime',
          checkOutTime: '10:00 PM (22:00)'
        }
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Room booking created successfully',
      data: newBooking,
      room: {
        name: room.name,
        type: room.type,
        remainingAvailable: room.getAvailableQuantity()
      }
    });
  } catch (error) {
    console.error('Room booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating room booking',
      error: error.message
    });
  }
});

// @route   GET /api/bookings/rooms/availability
// @desc    Check room availability for date range
// @access  Public
router.get('/availability', async (req, res) => {
  try {
    const { checkIn, checkOut, roomType } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Check-in and check-out dates are required'
      });
    }

    const whereClause = {
      availability: true,
      status: 'available'
    };

    if (roomType) {
      whereClause.type = roomType;
    }

    const rooms = await Room.findAll({
      where: whereClause,
      order: [['price', 'ASC']]
    });

    // Calculate available quantity for each room
    const availability = rooms.map(room => ({
      id: room.id,
      name: room.name,
      type: room.type,
      price: room.price,
      capacity: room.capacity,
      totalQuantity: room.totalQuantity,
      bookedQuantity: room.bookedQuantity,
      availableQuantity: room.getAvailableQuantity(),
      isAvailable: room.getAvailableQuantity() > 0,
      images: room.images,
      mainImage: room.mainImage,
      amenities: room.amenities,
      description: room.description
    }));

    res.json({
      success: true,
      checkIn,
      checkOut,
      data: availability
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking availability',
      error: error.message
    });
  }
});

// @route   DELETE /api/bookings/rooms/:id
// @desc    Cancel room booking (releases rooms)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Room, as: 'room' }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!booking.roomId) {
      return res.status(400).json({
        success: false,
        message: 'This is not a room booking'
      });
    }

    // Release the rooms
    if (booking.room) {
      await booking.room.releaseRooms(booking.roomQuantity);
    }

    // Mark as cancelled
    booking.status = 'cancelled';
    await booking.save();

    res.json({
      success: true,
      message: 'Room booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling booking',
      error: error.message
    });
  }
});

module.exports = router;
