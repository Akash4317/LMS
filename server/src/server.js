import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';

// load env
dotenv.config();

// import config
import connectDB from './config/database.js';
import logger from './utils/logger.js';

// import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';

// import routes
import routes from './routes/index.js';

// Import socket
import { initializeSocket } from './socket/index.js';

// initialise express app
const app = express();
const httpServer = createServer(app);

// middleware

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// cors
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Compression
app.use(compression());

// Rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);

// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        logger.info(`${req.method} ${req.path}`);
        next();
    });
}


// health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
})

// api routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path,
    });
});

// Error handler
app.use(errorHandler);

// initialize server
const PORT = process.env.PORT || 8000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Connect to Redis
        // await connectRedis(); removed as io redis do not required calling connect method

        // Initialize Socket.IO
        initializeSocket(httpServer);

        // Start server
        httpServer.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
            logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
    httpServer.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
    httpServer.close(() => {
        logger.info('💥 Process terminated!');
    });
});

// Start the server
startServer();

export default app;