import Institute from '../models/institute.js';
import user, { UserRole } from '../models/user.js';
import Course from '../models/course.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import uploadService from '../services/uploadService.js';

// Get all institutes
export const getAllInstitutes = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, isActive } = req.query;

    const query = {};

    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }

    if (search) {
        query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [institutes, total] = await Promise.all([
        Institute.find(query)
            .populate('admins', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Institute.countDocuments(query),
    ]);

    const institutesWithCounts = await Promise.all(
        institutes.map(async (institute) => {
            const courseCount = await Course.countDocuments({ instituteId: institute._id });
            return {
                ...institute.toObject(),
                courseCount,
                studentCount: institute.students.length,
                adminCount: institute.admins.length,
            };
        })
    );

    res.json({
        success: true,
        data: institutesWithCounts,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
})

// Get single institute
export const getInstituteById = asyncHandler(async (req, res) => {
    const institute = await Institute.findById(req.params.id)
        .populate('admins', 'name email avatar phone')
        .populate('students', 'name email avatar');

    if (!institute) {
        throw new AppError('Institute not found', 404);
    }

    // Check permissions
    if (req.user?.role !== UserRole.SUPER_ADMIN) {
        if (!institute.admins.some(admin => admin._id.toString() === req.user._id.toString())) {
            throw new AppError('You do not have permission to view this institute', 403);
        }
    }

    // Get additional stats
    const [courseCount, activeStudents, recentCourses] = await Promise.all([
        Course.countDocuments({ instituteId: institute._id }),
        user.countDocuments({
            _id: { $in: institute.students },
            isActive: true,
        }),
        Course.find({ instituteId: institute._id })
            .select('title thumbnail enrollmentCount createdAt')
            .sort({ createdAt: -1 })
            .limit(5),
    ]);

    res.json({
        success: true,
        data: {
            ...institute.toObject(),
            stats: {
                totalCourses: courseCount,
                totalStudents: institute.students.length,
                activeStudents,
                totalAdmins: institute.admins.length,
            },
            recentCourses,
        },
    });
})

// Create institute
export const createInstitute = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        address,
        contactEmail,
        contactPhone,
        website,
        subscription,
    } = req.body;

    // Check if institute with same email exists
    const existingInstitute = await Institute.findOne({ contactEmail });
    if (existingInstitute) {
        throw new AppError('Institute with this email already exists', 400);
    }

    const institute = await Institute.create({
        name,
        description,
        address,
        contactEmail,
        contactPhone,
        website,
        subscription,
    });

    res.status(201).json({
        success: true,
        message: 'Institute created successfully',
        data: institute,
    });
})

// Update institute
export const updateInstitute = asyncHandler(async (req, res) => {
    const institute = await Institute.findById(req.params.id);

    if (!institute) {
        throw new AppError('Institute not found', 404);
    }

    // Check permissions
    if (req.user?.role !== UserRole.SUPER_ADMIN) {
        if (!institute.admins.some(admin => admin.toString() === req.user._id.toString())) {
            throw new AppError('You do not have permission to update this institute', 403);
        }
    }

    const allowedUpdates = [
        'name',
        'description',
        'address',
        'contactEmail',
        'contactPhone',
        'website',
        'isActive',
        'subscription',
    ];

    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            if (field === 'address' || field === 'subscription') {
                (institute)[field] = { ...(institute)[field], ...req.body[field] };
            } else {
                (institute)[field] = req.body[field];
            }
        }
    });

    await institute.save();

    res.json({
        success: true,
        message: 'Institute updated successfully',
        data: institute,
    });
})

// Delete institute
export const deleteInstitute = asyncHandler(async (req, res) => {
    const institute = await Institute.findById(req.params.id);

    if (!institute) {
        throw new AppError('Institute not found', 404);
    }

    // Soft delete
    institute.isActive = false;
    await institute.save();

    // Deactivate all users
    await user.updateMany(
        { instituteId: institute._id },
        { isActive: false }
    );

    // Unpublish all courses
    await Course.updateMany(
        { instituteId: institute._id },
        { isPublished: false }
    );

    res.json({
        success: true,
        message: 'Institute deactivated successfully',
    });
})

// Upload institute logo
export const uploadLogo = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('Please upload an image', 400);
    }

    const institute = await Institute.findById(req.params.id);

    if (!institute) {
        throw new AppError('Institute not found', 404);
    }

    // Upload to cloudinary
    const result = await uploadService.uploadImage(req.file, 'lms/institutes');

    // Delete old logo
    if (institute.logo) {
        const publicId = institute.logo.split('/').slice(-2).join('/').split('.')[0];
        await uploadService.deleteFile(publicId, 'image');
    }

    institute.logo = result.url;
    await institute.save();

    res.json({
        success: true,
        message: 'Logo uploaded successfully',
        data: {
            url: result.url,
        },
    });
})

// Add admin to institute
export const addAdmin = asyncHandler(async (req, res) => {
    const { adminId } = req.body;

    const institute = await Institute.finsById(req.params.id);

    if (!institute) {
        throw new AppError('Institute not found', 404);
    }

    const admin = await user.findById(adminId);

    if (!admin || admin.role !== UserRole.ADMIN) {
        throw new AppError('Invalid admin user', 400);
    }

    // Check if already added
    if (institute.admins.some(id => id.toString() === adminId)) {
        throw new AppError('Admin already added to this institute', 400);
    }

    institute.admins.push(adminId);
    await institute.save();

    // Update admin's instituteId
    admin.instituteId = institute._id;
    await admin.save();

    res.json({
        success: true,
        message: 'Admin added to institute successfully',
        data: institute,
    })
})

// Remove admin from institute
export const removeAdmin = asyncHandler(async (req, res) => {
    const { adminId } = req.params;

    const institute = await Institute.findById(req.params.id);

    if (!institute) {
        throw new AppError('Institute not found', 404);
    }

    institute.admins = institute.admins.filter(id => id.toString() !== adminId);
    await institute.save();

    // Remove instituteId from admin
    await user.findByIdAndUpdate(adminId, { instituteId: null });

    res.json({
        success: true,
        message: 'Admin removed successfully',
    });
})

// Get institute statistics
export const getInstituteStats = asyncHandler(async (req, res) => {

    const institute = await Institute.findById(req.params.id);

    if (!institute) {
        throw new AppError('Institute not found', 404);
    }

    const [
        totalCourses,
        publishedCourses,
        totalStudents,
        activeStudents,
        totalEnrollments,
        averageCourseCompletion,
        recentEnrollments,
    ] = await Promise.all([
        Course.countDocuments({ instituteId: institute._id }),
        Course.countDocuments({ instituteId: institute._id, isPublished: true }),
        user.countDocuments({ instituteId: institute._id, role: UserRole.STUDENT }),
        user.countDocuments({ instituteId: institute._id, role: UserRole.STUDENT, isActive: true }),
        Course.aggregate([
            { $match: { instituteId: institute._id } },
            { $project: { studentCount: { $size: '$students' } } },
            { $group: { _id: null, total: { $sum: '$studentCount' } } },
        ]),
        require('../models/progress').default.aggregate([
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseId',
                    foreignField: '_id',
                    as: 'course',
                },
            },
            { $unwind: '$course' },
            { $match: { 'course.instituteId': institute._id } },
            { $group: { _id: null, avg: { $avg: '$completionPercentage' } } },
        ]),
        user.find({
            instituteId: institute._id,
            role: UserRole.STUDENT,
        })
            .select('name email avatar createdAt')
            .sort({ createdAt: -1 })
            .limit(10),
    ]);

    res.json({
        success: true,
        data: {
            totalCourses,
            publishedCourses,
            draftCourses: totalCourses - publishedCourses,
            totalStudents,
            activeStudents,
            inactiveStudents: totalStudents - activeStudents,
            totalEnrollments: totalEnrollments[0]?.total || 0,
            averageCourseCompletion: averageCourseCompletion[0]?.avg?.toFixed(2) || 0,
            recentEnrollments,
        },
    });
})

