/**
 * Welcome email template
 */
class WelcomeEmailTemplate {
    /**
     * Generate welcome email content
     * @param {object} data - Template data
     * @param {string} data.name - Recipient name
     * @param {string} data.unsubscribeUrl - Unsubscribe URL
     * @returns {object} Email subject, text and HTML content
     */
    generate(data) {
      return {
        subject: "Welcome to Our Newsletter!",
        text: this._generateTextContent(data),
        html: this._generateHtmlContent(data)
      };
    }
    
    /**
     * Generate plain text email content
     * @private
     * @param {object} data - Template data
     * @returns {string} Plain text email content
     */
    _generateTextContent(data) {
      return `
  Hello ${data.name},
  
  Thank you for subscribing to our newsletter!
  
  You'll receive our updates with the latest news and offers.
  
  If you wish to unsubscribe at any time, please visit:
  ${data.unsubscribeUrl}
  
  Best regards,
  The Team
      `.trim();
    }
    
    /**
     * Generate HTML email content
     * @private
     * @param {object} data - Template data
     * @returns {string} HTML email content
     */
    _generateHtmlContent(data) {
      return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Our Newsletter</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        text-align: center;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        font-size: 0.8em;
        color: #777;
      }
      .btn {
        display: inline-block;
        background-color: #4CAF50;
        color: white;
        padding: 10px 15px;
        text-decoration: none;
        border-radius: 4px;
        margin: 15px 0;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Welcome to Our Newsletter!</h1>
    </div>
    
    <div class="content">
      <h2>Hello, ${this._escapeHtml(data.name)}!</h2>
      <p>Thank you for subscribing to our newsletter.</p>
      <p>You'll receive our updates with the latest news and offers.</p>
      <p>
        <a href="${this._escapeHtml(data.unsubscribeUrl)}" class="btn">Unsubscribe</a>
      </p>
    </div>
    
    <div class="footer">
      <p>If you have any questions, please contact our support team.</p>
      <p>&copy; ${new Date().getFullYear()} Our Company. All rights reserved.</p>
    </div>
  </body>
  </html>
      `.trim();
    }
    
    /**
     * Escape HTML to prevent XSS
     * @private
     * @param {string} unsafe - Unsafe string that might contain HTML
     * @returns {string} Escaped HTML string
     */
    _escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  }
  
  export default new WelcomeEmailTemplate();