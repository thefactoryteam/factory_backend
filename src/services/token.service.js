import jwt from 'jsonwebtoken'
import config from '../config/config.js'


/**
 * Token Service - Responsible for secure token generation and validation
 */

class TokenService {
    constructor() {
        this.secret = process.env.TOKEN_SECRET || config.security.tokenSecret;

        if (!this.secret || this.secret === 'fallback-scret') {
            logger.warn('WARNING: Using insecure fallback secret for token generation')
        }
    }

    /**
     * Generate a secure unsubscribe token
     * @param {string} email - User's email
     * @returns {Promise<string>} Generated token
     */

    async generateUnsubscribeToken(email) {
        try {
            return jwt.sign(
                { email, purpose: 'unsubscribe' },
                this.secret,
                { expiresIn: '30d' }
            )
        } catch (error) {
            logger.error({ err: error }, 'Failed to generate unsubscribe token');
            throw new Error('Token generation failed');
        }
    }

    /**
   * Validate an unsubscribe token
   * @param {string} email - User's email
   * @param {string} token - Token to validate
   * @returns {Promise<boolean>} Token validity
   */
  async validateUnsubscribeToken(email, token) {
    try {
        try {
          const decoded = jwt.verify(token, this.secret);
          return decoded.email === email && decoded.purpose === 'unsubscribe';
        } catch (jwtError) {
          logger.warn({ err: jwtError }, `Invalid JWT token for ${email}`);
          return false;
        }
    } catch (error) {
      logger.error({ err: error }, 'Token validation failed');
      return false;
    }
  }
}

export default new TokenService();