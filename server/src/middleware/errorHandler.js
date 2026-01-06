import logger from "../utils/logger.js";

export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message

    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    })

    if (err.name === 'CastError') {
        error = new AppError('Resource not found', 404);
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error = new AppError(`${field} already exists`, 400);
    }

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
            .map(val => val.message)
            .join(', ');
        error = new AppError(message, 400);
    }

    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new AppError('Token expired', 401);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};