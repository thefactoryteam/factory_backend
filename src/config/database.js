import mongoose from "mongoose"
import logger from "./logger.js"

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : process.env.MONGODB_URI_TEST, {
            serverSelectionTimeoutMS: 5000
        })

        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        // Handle MongoDB connection errors after initial connection
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err)
        })

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected')
        })

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected')
        })

        return conn
    } catch (error) {
        logger.error('MongoDB connection error:', error)
        process.exit(1)
    }
}

export default connectDB