const express = require('express');
const router = express.Router();
const { Booking } = require('../models');
const payfastService = require('../utils/payfastService');
const sendEmail = require('../utils/emailService');

/**
 * @route   POST /api/payfast/initiate
 * @desc    Initialize payment with PayFast
 * @access  Public
 */
router.post('/initiate', async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Fetch booking
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if already paid
    if (booking.paymentStatus === 'fully-paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid for'
      });
    }

    // Check if booking is cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot process payment for cancelled booking'
      });
    }

    // Generate PayFast payment data
    const paymentData = payfastService.createPaymentData(booking);

    // Log payment initiation
    const currentNotes = booking.notes || [];
    currentNotes.push({
      date: new Date(),
      user: 'system',
      note: `Payment initiated via PayFast. Reference: ${booking.bookingReference}`,
      type: 'payment_initiation'
    });
    booking.notes = currentNotes;
    await booking.save();

    res.json({
      success: true,
      message: 'Payment data generated successfully',
      data: {
        paymentUrl: payfastService.getPaymentUrl(),
        paymentData: paymentData,
        bookingReference: booking.bookingReference
      }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/payfast/notify
 * @desc    Handle PayFast ITN (Instant Transaction Notification)
 * @access  Public (PayFast servers only)
 */
router.post('/notify', async (req, res) => {
  try {
    console.log('=== PayFast ITN Received ===');
    console.log('POST Data:', req.body);
    console.log('IP Address:', req.ip);

    // Immediately respond with 200 OK as required by PayFast
    res.status(200).send('OK');

    // Validate server IP (optional but recommended)
    const isValidIP = payfastService.validateServerIP(req.ip);
    if (!isValidIP) {
      console.error('Invalid IP address:', req.ip);
      return;
    }

    // Process ITN
    const itnResult = await payfastService.processITN(req.body);

    if (!itnResult.success) {
      console.error('ITN Processing Failed:', itnResult.message);
      return;
    }

    console.log('ITN Validated Successfully:', itnResult.data);

    // Update booking
    const booking = await Booking.findByPk(itnResult.data.bookingId);

    if (!booking) {
      console.error('Booking not found:', itnResult.data.bookingId);
      return;
    }

    // Update payment status
    booking.paymentStatus = 'fully-paid';
    booking.status = 'confirmed';

    // Update payment details
    const paymentDetails = {
      gateway: 'payfast',
      payfastPaymentId: itnResult.data.paymentId,
      amountGross: itnResult.data.amountGross,
      amountFee: itnResult.data.amountFee,
      amountNet: itnResult.data.amountNet,
      paymentMethod: itnResult.data.paymentMethod,
      paymentStatus: itnResult.data.paymentStatus,
      paidAt: itnResult.data.transactionDate,
      transactions: [
        {
          date: itnResult.data.transactionDate,
          status: 'fully-paid',
          method: itnResult.data.paymentMethod,
          amount: itnResult.data.amountGross,
          reference: itnResult.data.paymentId,
          processedBy: 'payfast'
        }
      ]
    };

    booking.paymentDetails = paymentDetails;

    // Add note
    const currentNotes = booking.notes || [];
    currentNotes.push({
      date: new Date(),
      user: 'system',
      note: `Payment received via PayFast. Amount: R${itnResult.data.amountGross}. Payment ID: ${itnResult.data.paymentId}`,
      type: 'payment_received'
    });
    booking.notes = currentNotes;

    await booking.save();

    console.log('Booking updated successfully:', booking.bookingReference);

    // Send confirmation email
    try {
      await sendEmail({
        to: booking.primaryGuest.email,
        subject: `Payment Confirmed - ${booking.bookingReference}`,
        template: 'payment-confirmation',
        data: {
          booking: booking.toJSON(),
          payment: paymentDetails
        }
      });
      console.log('Payment confirmation email sent');
    } catch (emailError) {
      console.error('Failed to send payment confirmation email:', emailError);
    }

  } catch (error) {
    console.error('ITN Handler Error:', error);
  }
});

/**
 * @route   GET /api/payfast/verify/:bookingId
 * @desc    Verify payment status for a booking
 * @access  Public
 */
router.get('/verify/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: {
        bookingReference: booking.bookingReference,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.status,
        paymentDetails: booking.paymentDetails,
        amount: booking.pricing.totalAmount
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/payfast/status
 * @desc    Get PayFast integration status
 * @access  Public
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      mode: process.env.PAYFAST_MODE,
      merchantId: process.env.PAYFAST_MERCHANT_ID,
      configured: !!(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY),
      paymentUrl: payfastService.getPaymentUrl()
    }
  });
});

/**
 * @route   POST /api/payfast/debug
 * @desc    Debug signature generation (shows parameter string before hashing)
 * @access  Public
 */
router.post('/debug', async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Fetch booking
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Generate PayFast payment data
    const paymentData = payfastService.createPaymentData(booking);

    // Get debug info from service
    const debugInfo = payfastService.getDebugInfo(paymentData);

    res.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          reference: booking.bookingReference,
          amount: booking.pricing.totalAmount,
          email: booking.primaryGuest.email
        },
        paymentData: paymentData,
        debug: debugInfo
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

module.exports = router;
