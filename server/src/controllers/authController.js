import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import user, { UserRole } from '../models/user.js';
import emailService from '../services/emailService.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

// register new user
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, role = UserRole.STUDENT, phone, instituteId } = req.body;

    // check existing user
    const existingUser = await user.findById({ email });
    if (existingUser) {
        throw new AppError('uesr with this email already exists', 400)
    }

    // Only super admin can create other super admins
    if (role === UserRole.SUPER_ADMIN && req.user?.role !== UserRole.SUPER_ADMIN) {
        throw new AppError('You do not have permission to create super admin accounts', 403);
    }

    // create user
    const user = await user.create({ name, email, password, role, phone, instituteId: instituteId || req.user?.instituteId, })

    // Generate token 
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // send welcome email
    emailService.sendWelcomeEmail(email, name);

    // remove pass from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: userResponse,
            accessToken,
            refreshToken,
        },
    })
})

// login user
export const login = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('Please provide email and password', 400);
    }

    const user = await user.findOne({ email }).select('+password');

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
        throw new AppError(
            'Your account has been deactivated. Please contact support.',
            403
        );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // generate token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // save uesr last login info
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // remove sensitive data 
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(`User logged in: ${user.email}`);

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: userResponse,
            accessToken,
            refreshToken,
        },
    });
})

// refresh token
export const refreshToken = asyncHandler(async (req, res) => {
    const tokenFromBody = req.body.refreshToken;
    const cookieToken = req.cookies?.refreshToken

    const refreshTokenToUse = tokenFromBody || cookieToken;

    if (!refreshTokenToUse) {
        throw new AppError('Refresh token not provided', 401);
    }

    // verify token
    const decoded = verifyRefreshToken(refreshTokenToUse);

    // find user
    const user = await user.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshTokenToUse) {
        throw new AppError('Invalid refresh token', 401);
    }

    if (!user.isActive) {
        throw new AppError('Your account has been deactivated', 403);
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // Update cookie
    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        },
    });
})

// logout
export const logout = asyncHandler(async (req, res) => {

    if (req.user) {
        req.user.refreshToken = undefined;
        await req.user.save();
    }
    // Clear cookie
    res.clearCookie('refreshToken');

    logger.info(`User logged out: ${req.user?.email}`);

    res.json({
        success: true,
        message: 'Logged out successfully',
    })
})

// get current user
export const getMe = asyncHandler(async (req, res) => {

    const user = await user.findById(req.user?._id)
        .select('-password -refreshToken')
        .populate('instituteId', 'name logo');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.json({
        success: true,
        data: user,
    });
})

// update profile
export const updateProfile = asyncHandler(async (req, res) => {

    const { name, phone, avatar } = req.body;

    const user = await user.findById(req.user?._id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Update fields

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();

    // remove sensitive information

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: userResponse,
    })
})

// change password
export const changePassword = asyncHandler(async (req, res) => {

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new AppError('Please provide current and new password', 400);
    }

    if (newPassword.length < 8) {
        throw new AppError('New password must be at least 8 characters long', 400);
    }

    const user = await user.findById(req.user?._id).select('+password');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // validate password

    const isValid = await user.comparePassword(currentPassword);

    if (!isValid) {
        throw new AppError('Current password is incorrect', 401);
    }

    // update password

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
        success: true,
        message: 'Password changed successfully',
    });
})

// forgot password
export const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body;
    if (!email) {
        throw new AppError('Please provide email', 400);
    }

    const user = user.findOne({ email });

    if (!user) {
        // Don't reveal if user exists
        res.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.',
        });
        return;
    }

    // generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    // reset url
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    const html = `
        <!DOCTYPE html>
        <html>
            <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #e53e3e; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #e53e3e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            </style>
            </head>
            <body>
            <div class="container">
                <div class="header">
                <h1>🔐 Password Reset Request</h1>
                </div>
                <div class="content">
                <p>Hi <strong>${user.name}</strong>,</p>
                <p>You requested to reset your password. Click the button below to reset it:</p>
                
                <a href="${resetUrl}" class="button">Reset Password</a>
                
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong>
                    <p>This link will expire in 30 minutes.</p>
                    <p>If you didn't request this, please ignore this email or contact support if you're concerned.</p>
                </div>
                
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                
                <p>Best regards,<br>The LMS Team</p>
                </div>
            </div>
            </body>
        </html>
    `;

    await emailService.sendEmail({
        to: email,
        subject: 'Password Reset Request',
        html,
    })

    logger.info(`Password reset email sent to: ${email}`);

    res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
    });
})

// reset password
export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
    }

    // Hash the token from URL
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
        resetPasswordToken: resetTokenHash,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    logger.info(`Password reset successful for user: ${user.email}`);

    res.json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.',
    });
})

// verify email
export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const user = await User.findById(token);
    if (!user) {
        throw new AppError('Invalid verification link', 400);
    }

    user.isEmailVerified = true;
    await user.save();

    res.json({
        success: true,
        message: 'Email verified successfully',
    });
})