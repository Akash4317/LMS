import course from '../models/course';
import progress from '../models/progress';
import syllabus from '../models/Syllabus';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { UserRole } from '../models/user';
import uploadService from '../services/uploadService';
import notificationService from '../services/notificationService';
import { notificationType } from '../models/notification';

// get all courses
export const getAllCourses = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search,
        category,
        level,
        instituteId,
        isFeatured,
        isPublished = true,
    } = req.query;

    const query = { isPublished };

    // Search
    if (search) {
        query.$text = { $search: search };
    }

    // Filters
    if (category) query.category = category;
    if (level) query.level = level;
    if (instituteId) query.instituteId = instituteId;
    if (isFeatured) query.isFeatured = isFeatured === 'true';

    // If admin, show only their institute courses
    if (req.user?.role === UserRole.ADMIN) {
        query.instituteId = req.user.instituteId;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [courses, total] = await Promise.all([
        course.find(query)
            .populate('instituteId', 'name logo')
            .populate('teachers', 'name email avatar')
            .populate('createdBy', 'name email')
            .select('-students')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        course.countDocuments(query),
    ]);

    res.json({
        success: true,
        data: courses,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
})

// Get single course
export const getCourseById = asyncHandler(async (req, res) => {
    const course = await course.findById(req.params.id)
        .populate('instituteId', 'name logo address contactEmail')
        .populate('teachers', 'name email avatar phone')
        .populate('createdBy', 'name email')
        .populate({
            path: 'syllabus',
            populate: {
                path: 'topics.lectures',
                model: 'Lecture',
            },
        });

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    // Check if user is enrolled
    let isEnrolled = false;
    let userProgress = null;

    if (req.user) {
        isEnrolled = course.students.some(
            studentId => studentId.toString() === req.user._id.toString()
        );

        if (isEnrolled) {
            userProgress = await Progress.findOne({
                studentId: req.user._id,
                courseId: course._id,
            });
        }
    }

    res.json({
        success: true,
        data: {
            ...course.toObject(),
            isEnrolled,
            enrollmentCount: course.students.length,
            progress: userProgress,
        },
    });
})

// create course
export const createCourse = asyncHandler(async (req, res) => {
    const { title, description, category, level, duration, price, enrollmentLimit, startDate, endDate, tags, } = req.body;

    const course = await course.create({ title, description, category, level, duration, price, enrollmentLimit, startDate, endDate, tags, instituteId: req.user?.instituteId, createdBy: req.user?._id, teachers: [req.user?._id], });

    await course.populate('instituteId teachers createdBy');

    res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course,
    });
})

// update course
export const updateCourse = asyncHandler(async (req, res) => {
    const course = await course.findById(req.params.id);

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    // Check permissions
    const isTeacher = course.teachers.some(
        teacherId => teacherId.toString() === req.user?._id.toString()
    );
    const isAdmin = [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(req.user?.role);

    if (!isTeacher && !isAdmin) {
        throw new AppError('You do not have permission to update this course', 403);
    }

    // Update fields
    const allowedUpdates = [
        'title',
        'description',
        'category',
        'level',
        'duration',
        'price',
        'isPublished',
        'isFeatured',
        'enrollmentLimit',
        'startDate',
        'endDate',
        'tags',
    ];

    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            (course)[field] = req.body[field];
        }
    });

    await course.save();
    await course.populate('instituteId teachers createdBy');

    res.json({
        success: true,
        message: 'Course updated successfully',
        data: course,
    });
})

// delete course
export const deleteCourse = asyncHandler(async (req, res) => {
    const course = await course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    course.isPublished = false; //soft delete
    await course.save();

    res.json({
        success: true,
        message: 'Course deleted successfully',
    });
});

// Upload course thumbnail
export const uploadThumbnail = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('Please upload an image', 400);
    }

    const course = await course.findById(req.params.id);

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    // Upload to cloudinary
    const result = await uploadService.uploadImage(req.file, 'lms/courses');

    // Delete old thumbnail
    if (course.thumbnail) {
        const publicId = course.thumbnail.split('/').slice(-2).join('/').split('.')[0];
        await uploadService.deleteFile(publicId, 'image');
    }

    course.thumbnail = result.url;
    await course.save();

    res.json({
        success: true,
        message: 'Thumbnail uploaded successfully',
        data: {
            url: result.url,
        },
    });
})

// Enroll in course
export const enrollInCourse = asyncHandler(async (req, res) => {
    const course = await course.findById(req.param.id);

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    if (!course.isPublished) {
        throw new AppError('This course is not available for enrollment', 400);
    }

    // Check enrollment limit
    if (course.enrollmentLimit && course.students.length >= course.enrollmentLimit) {
        throw new AppError('Course enrollment limit reached', 400);
    }

    // Check if already enrolled
    const isEnrolled = course.students.some(
        studentId => studentId.toString() === req.user._id.toString()
    );

    if (isEnrolled) {
        throw new AppError('You are already enrolled in this course', 400);
    }

    // Enroll student
    course.students.push(req.user._id);
    await course.save();

    // Create progress tracker
    const totalLectures = await syllabus.aggregate([
        { $match: { courseId: course._id } },
        { $unwind: '$topics' },
        { $unwind: '$topics.lectures' },
        { $count: 'total' },
    ]);

    await progress.create({
        studentId: req.user._id,
        courseId: course._id,
        totalLectures: totalLectures[0]?.total || 0,
    });

    // Send notification
    await notificationService.createNotification(
        req.user._id,
        notificationType.COURSE_ENROLLED,
        'Course Enrollment Successful',
        `You have successfully enrolled in ${course.title}`,
        { courseId: course._id },
        'MEDIUM',
        `/courses/${course._id}`
    );

    res.json({
        success: true,
        message: 'Enrolled successfully',
        data: course,
    });

})

// Unenroll from course
export const unenrollFromCourse = asyncHandler(async (req, res) => {

    const course = await course.findById(req.param.id);
    if (!course) {
        throw new AppError('course not found', 404);
    }

    // Remove student
    course.students = course.students.filter(
        studentId => studentId.toString() !== req.user._id.toString()
    );
    await course.save();

    // Delete progress
    await Progress.findOneAndDelete({
        studentId: req.user._id,
        courseId: course._id,
    });

    res.json({
        success: true,
        message: 'Unenrolled successfully',
    });
})

// Get enrolled students
export const getEnrolledStudents = asyncHandler(async (req, res) => {

    const course = await course.findById(req.params.id).populate(
        'students',
        'name email avatar phone createdAt'
    );

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    // Get progress for each student
    const studentsWithProgress = await Promise.all(
        course.students.map(async (student) => {
            const progress = await progress.findOne({
                studentId: student._id,
                courseId: course._id,
            });

            return {
                ...student.toObject(),
                progress: progress?.completionPercentage || 0,
                lastAccessed: progress?.lastAccessedAt,
            };
        })
    );

    res.json({
        success: true,
        data: studentsWithProgress,
    });
})

// Add teacher to course
export const addTeacherToCourse = asyncHandler(async (req, res) => {
    const { teacherId } = req.body;

    const course = await course.findById(req.param.id);

    if (!course) {
        throw new AppError('course not found', 404)
    }

    // Check if teacher already added
    if (course.teachers.some(id => id.toString() === teacherId)) {
        throw new AppError('Teacher already added to this course', 400);
    }

    course.teachers.push(teacherId);
    await course.save();

    await course.populate('teachers', 'name email avatar');

    res.json({
        success: true,
        message: 'Teacher added successfully',
        data: course,
    });
})

// Remove teacher from course
export const removeTeacherFromCourse = asyncHandler(async (req, res) => {
    const { teacherId } = req.body;

    const course = await course.findById(req.param.id);

    if (!course) {
        throw new AppError('course not found', 404);
    }

    course.teachers = course.teachers.filter(id => id.toString() !== teacherId);
    await course.save();

    res, json({
        success: true,
        message: 'teacher removed successfully'
    })
})

// Get course statistics
export const getCourseStats = asyncHandler(async (req, res) => {
    const course = await course.findById(req.param.id);

    if (!course) {
        throw new AppError('course not found', 404);
    }
    const [
        totalStudents,
        averageCompletion,
        lectureCount,
        assignmentCount,
    ] = await Promise.all([
        course.findById(req.params.id).select('students').then(c => c?.students.length || 0),
        progress.aggregate([
            { $match: { courseId: course._id } },
            { $group: { _id: null, avg: { $avg: '$completionPercentage' } } },
        ]),
        syllabus.aggregate([
            { $match: { courseId: course._id } },
            { $unwind: '$topics' },
            { $unwind: '$topics.lectures' },
            { $count: 'total' },
        ]),
        // You would add Assignment count here
        Promise.resolve(0),
    ]);

    res.json({
        success: true,
        data: {
            totalStudents,
            averageCompletion: averageCompletion[0]?.avg || 0,
            totalLectures: lectureCount[0]?.total || 0,
            totalAssignments: assignmentCount,
        },
    });
})

// Get my courses (enrolled courses for students)
export const getMyCourses = asyncHandler(async (req, res) => {
    const courses = await course.find({
        student: req.user.id,
        isPublished: true
    })
        .populate('instituteId', 'name logo')
        .populate('teachers', 'name email avatar')
        .sort({ createdAt: -1 });

    // Get progress for each course
    const coursesWithProgress = await Promise.all(
        courses.map(async course => {
            const progress = await progress.findOne({
                studentId: req.user._id,
                courseId: course._id,
            });

            return {
                ...course.toObject(),
                progress: progress?.completionPercentage || 0,
                lastAccessed: progress?.lastAccessedAt,
            };
        })
    );

    res.json({
        success: true,
        data: coursesWithProgress,
    });
})

// Get teaching courses (for teachers)
export const getTeachingCourses = asyncHandler(async (req, res) => {
    const courses = await course.find({
        teacherId: req.param.id,
    }).populate('instituteId', 'name logo')
        .select('title description thumbnail category level students createdAt isPublished')
        .sort({ createdAt: -1 });

    const coursesWithStats = courses.map(course => ({
        ...course.toObject(),
        enrollmentCount: course.students.length,
    }));

    res.json({
        success: true,
        data: coursesWithStats,
    });
})