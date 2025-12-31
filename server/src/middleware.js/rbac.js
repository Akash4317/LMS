import { UserRole } from "../models/user";

export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!res.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication Required'
            })
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action.',
                requiredRoles: allowedRoles,
                yourRole: req.user.role,
            });
        }
        next();
    }
}

export const checkOwnership = (resourceField) => {
    return (req, res, next) => {
        if (!req.user.role) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            })
        }
        if ([UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(req.user.role)) {
            return next();
        }

        const resourceOwnerId =
            req.body[resourceField] || req.params[resourceField];

        if (resourceOwnerId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only access your own resources.',
            });
        }
        next();
    }
}

export const checkInstitute = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }

        if (req.user.role === UserRole.SUPER_ADMIN) {
            return next();
        }

        if (!req.user.instituteId) {
            return res.status(403).json({
                success: false,
                message: 'You are not associated with any institute.',
            });
        }

        next();
    } catch {
        return res.status(500).json({
            success: false,
            message: 'Error checking institute permissions.',
        });
    }
};