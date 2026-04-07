// Simple email service without nodemailer for testing
class EmailService {
  constructor() {
    console.log('📧 Email service initialized (development mode - no emails will be sent)');
  }

  async sendEmail({ to, subject, template, data, html, text }) {
    try {
      console.log('📧 Email would be sent:', {
        to,
        subject: subject || 'Default Subject',
        template
      });

      return {
        success: true,
        messageId: 'dev-' + Date.now(),
        previewUrl: null
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

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