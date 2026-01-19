import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import User, { UserRole } from '../models/user.js';
import uploadService from '../services/uploadService.js';
import emailService from '../services/emailService.js';
import crypto from 'crypto';

// get all users
export const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, role, search, instituteId, isActive } = req.query;

    const query = {};

    // filter by role
    if (role) {
        query.role = role;
    }

    // Filter by institute (admins can only see their institute users)
    if (req.user?.role === UserRole.ADMIN) {
        query.instituteId = req.user.instituteId;
    } else if (instituteId) {
        query.instituteId = instituteId;
    }

    // filter by status
    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }

    // Search by name or email
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
        user.find(query)
            .select('-password -refreshToken')
            .populate('instituteId', 'name logo')
            .populate('linkedStudents', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        user.countDocuments(query),
    ]);

    res.json({
        success: true,
        data: users,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
})

// get single user
export const getUserById = asyncHandler(async (req, res) => {
    const user = await user.findById(req.params.id)
        .select('-password -refreshToken')
        .populate('instituteId', 'name logo address contactEmail')
        .populate('linkedStudents', 'name email avatar');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Check permissions
    if (
        req.user?.role !== UserRole.SUPER_ADMIN &&
        req.user?.role !== UserRole.ADMIN &&
        req.user?._id.toString() !== user._id.toString()
    ) {
        throw new AppError('You do not have permission to view this user', 403);
    }

    res.json({
        success: true,
        data: user,
    });
})

// Create new user
export const createUser = asyncHandler(async (req, res) => {

    const { name, email, role, phone, instituteId, linkedStudents } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('User with this email already exists', 400);
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');

    // Set institute ID
    let finalInstituteId = instituteId;
    if (req.user?.role === UserRole.ADMIN) {
        finalInstituteId = req.user.instituteId;
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password: tempPassword,
        role,
        phone,
        instituteId: finalInstituteId,
        linkedStudents: role === UserRole.PARENT ? linkedStudents : undefined,
    });

    // Send welcome email with temp password
    await emailService.sendWelcomeEmail(email, name, tempPassword);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.status(201).json({
        success: true,
        message: 'User created successfully. Temporary password sent via email.',
        data: userResponse,
    });
})

// Update user
export const updateUser = asyncHandler(async (req, res) => {

    const { name, phone, avatar, role, isActive, linkedStudents } = req.body;

    const user = await user.findById(req.params.id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Check permissions
    const isSelf = req.user?._id.toString() === user._id.toString();
    const isAdmin = [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(req.user?.role);

    if (!isSelf && !isAdmin) {
        throw new AppError('You do not have permission to update this user', 403);
    }

    if ((role || isActive !== undefined) && !isAdmin) {
        throw new AppError('Only admins can change role and active status', 403);
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (role && isAdmin) user.role = role;
    if (isActive !== undefined && isAdmin) user.isActive = isActive;
    if (linkedStudents && user.role === UserRole.PARENT) {
        user.linkedStudents = linkedStudents;
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.json({
        success: true,
        message: 'User updated successfully',
        data: userResponse,
    });

})

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await user.findById(req.params.id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Prevent self-deletion
    if (req.user?._id.toString() === user._id.toString()) {
        throw new AppError('You cannot delete your own account', 400);
    }

    // Soft delete 
    user.isActive = false;
    await user.save();

    res.json({
        success: true,
        message: 'User deactivated successfully',
    });
})

// Upload avatar
export const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('Please upload an image file', 400);

    // upload image to cloudinary
    const result = await uploadService.uploadImage(req.file, 'lms/avatars');

    // update user avatar
    const user = await user.findById(req.user?._id);
    if (user) {
        // Delete old avatar if exists
        if (user.avatar) {
            const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
            await uploadService.deleteFile(publicId, 'image');
        }

        user.avatar = result.url;
        await user.save();
    }

    res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
            url: result.url,
        },
    });
})

// Link parent to student
export const linkStudentToParent = asyncHandler(async (req, res) => {
    const { studentId } = req.body;
    if (!studentId) {
        throw new AppError('Student ID is required', 400);
    }

    // Get student
    const student = await user.findById(studentId);
    if (!student || student.role !== UserRole.STUDENT) {
        throw new AppError('Invalid student', 400);
    }

    // Get parent
    const parent = await user.findById(req.user?._id);
    if (!parent || parent.role !== UserRole.PARENT) {
        throw new AppError('Only parents can link students', 403);
    }

    // Check if already linked
    if (parent.linkedStudents?.some(id => id.toString() === studentId)) {
        throw new AppError('Student already linked', 400);
    }

    // Link student
    parent.linkedStudents = parent.linkedStudents || [];
    parent.linkedStudents.push(studentId);
    await parent.save();

    res.json({
        success: true,
        message: 'Student linked successfully',
        data: parent,
    });
})

// Unlink student from parent
export const unlinkStudentFromParent = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    const parent = await user.findById(req.user?._id);
    if (!parent || parent.role !== UserRole.PARENT) {
        throw new AppError('Only parents can unlink students', 403);
    }

    // Remove student from linked students
    parent.linkedStudents = parent.linkedStudents?.filter(
        id => id.toString() !== studentId
    );
    await parent.save();

    res.json({
        success: true,
        message: 'Student unlinked successfully',
    });
})

// Get user statistics
export const getUserStats = asyncHandler(async (req, res) => {
    const query = {};

    // Admins can only see their institute stats
    if (req.user?.role === UserRole.ADMIN) {
        query.instituteId = req.user.instituteId;
    }

    const [totalUsers, activeUsers, studentCount, teacherCount, parentCount, recentUsers] = await Promise.all([
        user.countDocuments(query),
        user.countDocuments({ ...query, isActive: true }),
        user.countDocuments({ ...query, role: UserRole.STUDENT }),
        user.countDocuments({ ...query, role: UserRole.ADMIN }),
        user.countDocuments({ ...query, role: UserRole.PARENT }),
        user.find(query)
            .select('name email role createdAt avatar')
            .sort({ createdAt: -1 })
            .limit(5),
    ]);

    res.json({
        success: true,
        data: {
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            byRole: {
                students: studentCount,
                teachers: teacherCount,
                parents: parentCount,
            },
            recentUsers,
        },
    })
});

// bulk create user
export const bulkCreateUsers = asyncHandler(async (req, res) => {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
        throw new AppError('Please provide an array of users', 400);
    }

    if (users.length > 100) {
        throw new AppError('Maximum 100 users can be created at once', 400);
    }

    const createdUsers = [];
    const errors = [];

    for (const userData of users) {
        try {
            // Check if user exists
            const existingUser = await user.findOne({ email: userData.email });
            if (existingUser) {
                errors.push({
                    email: userData.email,
                    error: 'User already exists',
                });
                continue;
            }

            // Generate temp password
            const tempPassword = crypto.randomBytes(8).toString('hex');

            // Create user
            const user = await User.create({
                name: userData.name,
                email: userData.email,
                password: tempPassword,
                role: userData.role || UserRole.STUDENT,
                phone: userData.phone,
                instituteId: req.user?.role === UserRole.ADMIN
                    ? req.user.instituteId
                    : userData.instituteId,
            });

            // Send welcome email
            emailService.sendWelcomeEmail(userData.email, userData.name, tempPassword);

            createdUsers.push({
                id: user._id,
                email: user.email,
                name: user.name,
            });
        } catch (error) {
            errors.push({
                email: userData.email,
                error: error.message,
            });
        }
    };
    res.status(201).json({
        success: true,
        message: `${createdUsers.length} users created successfully`,
        data: {
            created: createdUsers,
            errors,
        },
    });
})