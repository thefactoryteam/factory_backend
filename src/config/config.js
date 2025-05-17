/**
 * Application configuratin with sensible defaults
 * Environmnt variables take precedence over defaults
 */

const config = {
    // Node environment
    env: process.env.NODE_ENV || 'development',

    // Server settings
    server: {
        port: parseInt(process.env.PORT, 10) || 6000,
        host: process.env.HOST || '0.0.0.0'
    },

    // Database settings
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/db_factory',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            autoIndex: process.env.NODE_ENV !== 'production'
        }
    },

    // Email service configuration
    email: {
        provider: process.env.EMAIL_PROVIDER || 'mailtrap',

        // Sender information
        sender: {
            email: process.env.SENDER_EMAIL || 'dev@oodoroland.com',
            name: process.env.SENDER_NAME || 'The TechFactory'
        },

        // Mailtrap configuration
        mailtrap: {
            token: process.env.MAILTRAP_TOKEN
        }

        // Additional providers can be configured here
        // sendgrid: {
        //   apiKey: process.env.SENDGRID_API_KEY
        // }
    },

    // Frontend URL for redirects and links
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:8080'
    },

    // Security settings
    security: {
        tokenSecret: process.env.TOKEN_SECRET || 'default-secret-change-in-production',
        tokenExpiryDays: parseInt(process.env.TOKEN_EXPIRY_DAYS, 10) || 30
    },


}