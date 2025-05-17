import { MailtrapClient } from "mailtrap";
import logger from "../../../config/logger";

/**
 * Mailtrap Email Provider
 * Implements the email provider interface for Mailtrap
 */

class MailtrapProvider {
    /**
     * Initialize Mailtrap provider
     * @param {object} config - Provider configuration
     * @param {string} config.apiToken - Mailtrap API token
     * @param {object} config.sender - Default sender information
     * @param {string} config.sender.email - Sender email
     * @param {string} config.sender.name - Sender name
     */

    constructor(config) {
        this.client = new MailtrapClient({ token: config.apiToken })
        this.sender = config.sender;

        // Validate configuration
        if (!config.apiToken) {
            logger.warn("MailtrapProvider initialized without API token")
        }
    }

    /**
     * Send email through Mailtrap
     * @param {object} options - Email options
     * @param {array} options.to - Recipients array [{email, name}]
     * @param {string} options.subject - Email subject
     * @param {string} options.text - Plain text email content
     * @param {string} options.html - HTML email content
     * @param {string} options.category - Email category for tracking
     * @returns {Promise} Mailtrap sending result
     */

    async send(options) {
        try {
            // Filter out any invalid recipients
            const validRecipients = options.to.filter(recipient => recipient && recipient.email && this._isValidEmail(recipient.email))

            if (validRecipients.length === 0) {
                throw new Error("No valid recipients provided")
            }

            // Validate required fields
            if (!options.subject) {
                throw new Error("Email subject is required")
            }

            if (!options.text && !options.html) {
                throw new Error("Email must have either text or HTML content")
            }

            // Prepare email payload
            const payload = {
                from: this.sender,
                to: validRecipients,
                subject: options.subject,
                category: options.category || "General"
            }

            // Add content based on what's provided
            if (options.text) {
                payload.text = options.text
            }

            if (options.html) {
                payload.html = options.html
            }

            // Add optional fields if provided
            if (options.cc) payload.cc = options.cc;
            if (options.bcc) payload.bcc = options.bcc;
            if (options.attachments) payload.attachments = options.attachments;

            // Log without sensitive content
            logger.debug({
                provider: 'mailtrap',
                to: validRecipients.map(r => r.email),
                subject: options.subject
            }, "Sending email");

            // Send email
            const response = await this.client.send(payload);

            return {
                provider: 'mailtrap',
                messageId: response.id,
                success: true
            };

        } catch (error) {
            logger.error({ err: error }, "Mailtrap provider failed to send email");
      throw error;
        }
    }

    /**
   * Validate email format
   * @private
   * @param {string} email - Email to validate
   * @returns {boolean} Is email valid
   */
  _isValidEmail(email) {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(email).toLowerCase());
  }
}