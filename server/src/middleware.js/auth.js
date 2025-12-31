import user from '../models/user.js';
import { verifyAccessToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            })
        }

        const token = authHeader.substring(7);

        const decoded = verifyAccessToken(token);

        const user = await user.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found or token is invalid.',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated.',
            });
        }

        req.user = user;
        next();

    } catch (error) {
        logger.error('authentication error:', error)

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please refresh your token.',
                code: 'TOKEN_EXPIRED',
            })
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
        }
        return res.status(500).json({
            success: false,
            message: 'authentication failed'
        })
    }
}

// optioanl auth for simple authentication
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyAccessToken(token);
            const user = await user.findById(decoded.userId).select('-password');

            if (user && user.isActive) {
                req.user = user;
            }
        }

        next();
    } catch {
        next();
    }
};