// services/email/email.service.js

import config from "../../config/config.js";
import logger from "../../config/logger.js";
import tokenService from "../token.service.js";
import MailtrapProvider from "./providers/mailtrap.provider.js";
import welcomeTemplate from "./templates/welcome.template.js";

/**
 * Email Service - Factory pattern for email sending
 */
class EmailService {
  constructor() {
    // Initialize with default provider
    this.provider = this._initializeProvider();
    // Validate configuration
    if (!this.provider) {
      logger.warn("EmailService initialized without valid provider");
    }
  }
  
  /**
   * Initialize email provider based on configuration
   * @private
   * @returns {object} Email provider instance
   */
  _initializeProvider() {
    const providerType = config.email.provider || 'mailtrap';
    
    switch (providerType) {
      case 'mailtrap':
        return new MailtrapProvider({
          apiToken: config.email.mailtrap.token,
          sender: {
            email: config.email.sender.email,
            name: config.email.sender.name
          }
        });
      // Add more providers as needed
      // case 'sendgrid':
      //   return new SendgridProvider(config.email.sendgrid);
      default:
        logger.error(`Unknown email provider: ${providerType}`);
        return null;
    }
  }

  /**
   * Send welcome email to new subscriber
   * @param {object} recipient - Email recipient data
   * @returns {Promise} Email sending result
   */
  async sendWelcomeEmail(recipient) {
    try {
      logger.debug(`Preparing to send welcome email to ${recipient.email}`);
      
      // Generate unsubscribe token
      const unsubscribeToken = await tokenService.generateUnsubscribeToken(recipient.email);
      
      // Generate content from template
      const { subject, text, html } = welcomeTemplate.generate({
        name: recipient.name,
        unsubscribeUrl: `${config.frontend.url}/unsubscribe?email=${encodeURIComponent(recipient.email)}&token=${unsubscribeToken}`
      });
      
      // Send email through provider
      const response = await this.provider.send({
        to: [{ email: recipient.email, name: recipient.name }],
        subject,
        text,
        html,
        category: "Newsletter Welcome"
      });
      
      logger.debug(`Welcome email sent successfully to ${recipient.email}`);
      return response;
    } catch (error) {
      logger.error({ err: error }, `Failed to send welcome email to ${recipient.email}`);
      throw error;
    }
  }
  
  /**
   * Send a custom email
   * @param {object} options - Email options
   * @returns {Promise} Email sending result
   */
  async sendEmail(options) {
    try {
      return await this.provider.send(options);
    } catch (error) {
      logger.error({ err: error }, `Failed to send email to ${options.to}`);
      throw error;
    }
  }
}

export default new EmailService();