const nodemailer = require('nodemailer');

// Email templates
const emailTemplates = {
  'booking-confirmation': (data) => ({
    subject: `Booking Confirmation - ${data.booking.bookingReference}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Booking Confirmation</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Phokela Guest House</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Dear ${data.booking.primaryGuest.firstName} ${data.booking.primaryGuest.lastName},</p>

          <p>Thank you for choosing Phokela Guest House! Your booking has been confirmed.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #333;">Booking Details</h3>
            <p><strong>Booking Reference:</strong> ${data.booking.bookingReference}</p>
            <p><strong>Service:</strong> ${data.booking.serviceSnapshot.name}</p>
            <p><strong>Category:</strong> ${data.booking.serviceSnapshot.category}</p>
            <p><strong>Guests:</strong> ${data.booking.bookingDetails.adults} Adults, ${data.booking.bookingDetails.children} Children</p>
            ${data.booking.bookingDetails.checkIn ? `<p><strong>Check-in:</strong> ${new Date(data.booking.bookingDetails.checkIn).toLocaleDateString()}</p>` : ''}
            ${data.booking.bookingDetails.checkOut ? `<p><strong>Check-out:</strong> ${new Date(data.booking.bookingDetails.checkOut).toLocaleDateString()}</p>` : ''}
            ${data.booking.bookingDetails.eventDate ? `<p><strong>Event Date:</strong> ${new Date(data.booking.bookingDetails.eventDate).toLocaleDateString()}</p>` : ''}
            <p><strong>Total Amount:</strong> R${data.booking.pricing.totalAmount}</p>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1976d2;">Contact Information</h4>
            <p style="margin: 5px 0;"><strong>Phone:</strong> 083 594 0966 / 076 691 1116</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> admin@phokelaholdings.co.za</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> 108 Cnr VAN RIEBECK & DUDU MADISHA DRIVE</p>
          </div>

          <p>If you have any questions or need to make changes to your booking, please don't hesitate to contact us.</p>

          <p>We look forward to hosting you!</p>

          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>The Phokela Guest House Team</strong>
          </p>
        </div>
      </div>
    `
  }),

  'contact-auto-reply': (data) => ({
    subject: 'Thank you for contacting Phokela Guest House',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Thank You for Your Inquiry</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Phokela Guest House</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Dear ${data.contact.name},</p>

          <p>Thank you for reaching out to Phokela Guest House. We have received your inquiry and will respond within 24 hours.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #333;">Your Message</h3>
            <p><strong>Service Interest:</strong> ${data.contact.service || 'General Inquiry'}</p>
            <p><strong>Message:</strong> ${data.contact.message}</p>
          </div>

          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #2e7d32;">Need Immediate Assistance?</h4>
            <p style="margin: 5px 0;">For urgent matters, please call us directly:</p>
            <p style="margin: 5px 0;"><strong>083 594 0966</strong> or <strong>076 691 1116</strong></p>
          </div>

          <p>
            Best regards,<br>
            <strong>The Phokela Guest House Team</strong>
          </p>
        </div>
      </div>
    `
  }),

  'contact-notification': (data) => ({
    subject: `New Contact Form Submission - ${data.contact.service}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">New Contact Form Submission</h2>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${data.contact.name}</p>
          <p><strong>Email:</strong> ${data.contact.email}</p>
          <p><strong>Phone:</strong> ${data.contact.phone || 'Not provided'}</p>
          <p><strong>Service Interest:</strong> ${data.contact.service}</p>
          <p><strong>Subject:</strong> ${data.contact.subject || 'No subject'}</p>
          <p><strong>Priority:</strong> ${data.contact.priority}</p>
          <p><strong>Submitted:</strong> ${new Date(data.contact.createdAt).toLocaleString()}</p>
        </div>

        <div style="background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h4>Message:</h4>
          <p>${data.contact.message}</p>
        </div>

        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          This is an automated notification from the Phokela Guest House website.
        </p>
      </div>
    `
  })
};

class EmailService {
  constructor() {
    this.transporter = null;
    this.setupTransporter();
  }

  setupTransporter() {
    // For development, use Ethereal Email (fake SMTP)
    if (process.env.NODE_ENV === 'development') {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
    } else {
      // For production, use real SMTP settings
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  async sendEmail({ to, subject, template, data, html, text }) {
    try {
      let emailContent = {};

      if (template && emailTemplates[template]) {
        emailContent = emailTemplates[template](data);
      } else {
        emailContent = { subject, html, text };
      }

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@phokelaholdings.co.za',
        to,
        subject: emailContent.subject || subject,
        html: emailContent.html || html,
        text: emailContent.text || text
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email sent (Preview):', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  // Bulk email sending
  async sendBulkEmails(emails) {
    const results = [];
    for (const email of emails) {
      try {
        const result = await this.sendEmail(email);
        results.push({ success: true, email: email.to, result });
      } catch (error) {
        results.push({ success: false, email: email.to, error: error.message });
      }
    }
    return results;
  }
}

const emailService = new EmailService();

// Export function for backward compatibility
module.exports = (options) => emailService.sendEmail(options);

// Also export the service class
module.exports.EmailService = EmailService;
module.exports.emailService = emailService;