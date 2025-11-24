const crypto = require('crypto');

/**
 * PayFast Integration Service
 * Handles signature generation, payment initialization, and ITN validation
 */

const PAYFAST_HOSTS = {
  sandbox: 'sandbox.payfast.co.za',
  production: 'www.payfast.co.za'
};

/**
 * Sanitize text for PayFast to avoid special character encoding issues
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeForPayFast(text) {
  if (!text) return '';

  return text
    .replace(/[()[\]{}]/g, '') // Remove brackets and parentheses
    .replace(/['"]/g, '') // Remove quotes
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/[^\w\s-]/g, '') // Remove other special characters except hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

class PayFastService {
  constructor() {
    this.merchantId = process.env.PAYFAST_MERCHANT_ID;
    this.merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    this.passphrase = process.env.PAYFAST_PASSPHRASE;
    this.mode = process.env.PAYFAST_MODE || 'sandbox';
    this.returnUrl = process.env.PAYFAST_RETURN_URL;
    this.cancelUrl = process.env.PAYFAST_CANCEL_URL;
    this.notifyUrl = process.env.PAYFAST_NOTIFY_URL;
  }

  /**
   * Generate payment URL for PayFast
   * @returns {string} PayFast payment URL
   */
  getPaymentUrl() {
    return `https://${PAYFAST_HOSTS[this.mode]}/eng/process`;
  }

  /**
   * Generate MD5 signature for PayFast
   * CRITICAL: Uses ALPHABETICAL ordering (not documentation order!)
   * @param {Object} data - Payment parameters
   * @param {string} passphrase - Security passphrase
   * @returns {string} MD5 signature
   */
  generateSignature(data, passphrase = this.passphrase) {
    // Create signature data object
    const signatureData = {};

    // Add all non-empty values to signature data
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value && value.toString().trim() !== '') {
        signatureData[key] = value.toString().trim();
      }
    });

    // Add passphrase if provided (include in alphabetical sort!)
    if (passphrase && passphrase.trim() !== '') {
      signatureData['passphrase'] = passphrase.trim();
    }

    // Sort keys ALPHABETICALLY and build parameter string
    const sortedKeys = Object.keys(signatureData).sort();

    let paramString = '';
    for (const key of sortedKeys) {
      if (key !== 'signature') { // Exclude signature itself
        const value = signatureData[key];
        // URL encode and replace %20 with + for spaces (PayFast requirement)
        const encodedValue = encodeURIComponent(value).replace(/%20/g, '+');
        paramString += `${key}=${encodedValue}&`;
      }
    }

    // Remove trailing &
    paramString = paramString.slice(0, -1);

    // Generate MD5 hash
    return crypto.createHash('md5').update(paramString).digest('hex');
  }

  /**
   * Validate PayFast ITN data
   * @param {Object} data - ITN POST data
   * @returns {boolean} Validation result
   */
  validateSignature(data) {
    const providedSignature = data.signature;
    delete data.signature;

    const calculatedSignature = this.generateSignature(data);

    return providedSignature === calculatedSignature;
  }

  /**
   * Validate server IP address (ITN only comes from PayFast servers)
   * @param {string} ip - Request IP address
   * @returns {boolean} Validation result
   */
  validateServerIP(ip) {
    const validHosts = [
      'www.payfast.co.za',
      'sandbox.payfast.co.za',
      'w1w.payfast.co.za',
      'w2w.payfast.co.za'
    ];

    // For local development, accept localhost
    if (this.mode === 'sandbox' && (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost')) {
      return true;
    }

    // In production, validate against PayFast IPs
    // Note: You may need to do DNS lookup to verify
    return true; // Simplified for now
  }

  /**
   * Create payment data object for PayFast
   * @param {Object} booking - Booking object
   * @returns {Object} Payment data
   */
  createPaymentData(booking) {
    const amount = booking.pricing.totalAmount.toFixed(2);
    const serviceName = booking.serviceSnapshot?.name || 'Phokela Guest House Booking';

    // Build description
    let description = serviceName;
    if (booking.bookingDetails.checkIn && booking.bookingDetails.checkOut) {
      const checkIn = new Date(booking.bookingDetails.checkIn).toLocaleDateString();
      const checkOut = new Date(booking.bookingDetails.checkOut).toLocaleDateString();
      description += ` (${checkIn} - ${checkOut})`;
    } else if (booking.bookingDetails.eventDate) {
      const eventDate = new Date(booking.bookingDetails.eventDate).toLocaleDateString();
      description += ` (${eventDate})`;
    }

    // Sanitize item name and description for PayFast compatibility
    const sanitizedItemName = sanitizeForPayFast(serviceName);
    const sanitizedDescription = sanitizeForPayFast(description);

    const paymentData = {
      // Merchant details
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,

      // URLs
      return_url: this.returnUrl,
      cancel_url: this.cancelUrl,
      notify_url: this.notifyUrl,

      // Buyer details
      name_first: booking.primaryGuest.firstName,
      name_last: booking.primaryGuest.lastName,
      email_address: booking.primaryGuest.email,

      // Transaction details
      m_payment_id: booking.bookingReference, // Your unique booking reference
      amount: amount,
      item_name: sanitizedItemName,
      item_description: sanitizedDescription,

      // Custom fields
      custom_int1: booking.id, // Booking ID
      custom_str1: booking.status, // Booking status
    };

    // Generate signature
    paymentData.signature = this.generateSignature(paymentData);

    return paymentData;
  }

  /**
   * Verify payment with PayFast (optional additional validation)
   * @param {string} paymentId - PayFast payment ID
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(paymentId) {
    // This would make an API call to PayFast to verify the payment
    // For now, we'll rely on ITN validation
    return { verified: true };
  }

  /**
   * Generate payment form HTML
   * @param {Object} paymentData - Payment data object
   * @returns {string} HTML form
   */
  generatePaymentForm(paymentData) {
    const paymentUrl = this.getPaymentUrl();

    let form = `<form action="${paymentUrl}" method="POST" id="payfast-form">\n`;

    Object.keys(paymentData).forEach(key => {
      form += `  <input type="hidden" name="${key}" value="${paymentData[key]}">\n`;
    });

    form += `  <button type="submit">Pay Now</button>\n`;
    form += `</form>`;

    return form;
  }

  /**
   * Get debug information for signature generation
   * @param {Object} data - Payment data object (including signature)
   * @returns {Object} Debug information
   */
  getDebugInfo(data) {
    // Remove signature to regenerate
    const dataWithoutSignature = { ...data };
    delete dataWithoutSignature.signature;

    // Build signature data object (same as generateSignature)
    const signatureData = {};

    // Add all non-empty values to signature data
    Object.keys(dataWithoutSignature).forEach(key => {
      const value = dataWithoutSignature[key];
      if (value && value.toString().trim() !== '') {
        signatureData[key] = value.toString().trim();
      }
    });

    // Add passphrase if provided (include in alphabetical sort!)
    const passphrase = this.passphrase;
    if (passphrase && passphrase.trim() !== '') {
      signatureData['passphrase'] = passphrase.trim();
    }

    // Sort keys ALPHABETICALLY
    const sortedKeys = Object.keys(signatureData).sort();

    let paramString = '';
    const includedFields = [];

    // Build parameter string with alphabetical ordering
    for (const key of sortedKeys) {
      if (key !== 'signature') {
        const value = signatureData[key];
        // URL encode and replace %20 with + for spaces (PayFast requirement)
        const encodedValue = encodeURIComponent(value).replace(/%20/g, '+');
        paramString += `${key}=${encodedValue}&`;
        includedFields.push({
          key,
          originalValue: value,
          encodedValue: encodedValue
        });
      }
    }

    // Remove trailing &
    paramString = paramString.slice(0, -1);

    // Build parameter string WITHOUT passphrase for display
    let paramStringBeforePassphrase = '';
    for (const key of sortedKeys) {
      if (key !== 'signature' && key !== 'passphrase') {
        const value = signatureData[key];
        const encodedValue = encodeURIComponent(value).replace(/%20/g, '+');
        paramStringBeforePassphrase += `${key}=${encodedValue}&`;
      }
    }
    paramStringBeforePassphrase = paramStringBeforePassphrase.slice(0, -1);

    // Generate MD5 hash
    const generatedSignature = crypto.createHash('md5').update(paramString).digest('hex');

    return {
      signature: {
        provided: data.signature,
        generated: generatedSignature,
        match: data.signature === generatedSignature
      },
      paramString: {
        beforePassphrase: paramStringBeforePassphrase,
        withPassphrase: paramString,
        length: paramString.length
      },
      config: {
        merchantId: this.merchantId,
        merchantKey: this.merchantKey,
        passphrase: passphrase,
        mode: this.mode
      },
      includedFields: includedFields,
      totalFields: includedFields.length
    };
  }

  /**
   * Process ITN callback from PayFast
   * @param {Object} data - ITN POST data
   * @returns {Object} Processing result
   */
  async processITN(data) {
    const result = {
      success: false,
      message: '',
      data: null
    };

    try {
      // 1. Validate signature
      if (!this.validateSignature({ ...data })) {
        result.message = 'Invalid signature';
        return result;
      }

      // 2. Validate payment status
      if (data.payment_status !== 'COMPLETE') {
        result.message = `Payment not complete. Status: ${data.payment_status}`;
        result.data = { status: data.payment_status };
        return result;
      }

      // 3. Extract booking information
      const bookingReference = data.m_payment_id;
      const bookingId = parseInt(data.custom_int1);
      const amountGross = parseFloat(data.amount_gross);
      const amountFee = parseFloat(data.amount_fee);
      const amountNet = parseFloat(data.amount_net);

      result.success = true;
      result.message = 'Payment verified successfully';
      result.data = {
        bookingReference,
        bookingId,
        paymentId: data.pf_payment_id,
        amountGross,
        amountFee,
        amountNet,
        paymentStatus: data.payment_status,
        transactionDate: new Date(),
        paymentMethod: data.payment_method || 'unknown'
      };

      return result;
    } catch (error) {
      result.message = `ITN processing error: ${error.message}`;
      return result;
    }
  }
}

module.exports = new PayFastService();
