import mongoose, { connect } from 'mongoose'
import logger from '../utils/logger';

const connectDB = async () => {
    try {
        const mongoURI = process.env.NODE_ENV === 'development'
            ? process.env.MONGODB_URI
            : process.env.MONGODB_URI_PROD;

        await mongoose.connect(mongoURI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info('MongoDB connected successfully');

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });
    }
    catch (error) {
        logger.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}

export default connectDB