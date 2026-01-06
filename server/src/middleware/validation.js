import { validationResult } from 'express-validator';

export const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(v => v.run(req)));

        const errors = validationResult(req);

        if (errors.isEmpty()) {
            return next();
        }

        const extractedErrors = [];

        errors.array().forEach(err => {
            extractedErrors.push({
                field: err.path,
                message: err.msg,
            });
        });
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: extractedErrors,
        });

    }
}