import LiveClass, { ClassType, ClassStatus } from '../models/liveClass.js';
import user from '../models/user.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

// Get all live classes for a course
export const getCourseLiveClasses = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { status, upcoming } = req.query;

    const query = { courseId };

    if (status) {
        query.status = status;
    }

    if (upcoming === 'true') {
        query.scheduledAt = { $gte: new Date() };
        query.status = ClassStatus.SCHEDULED;
    }

    const liveClasses = await LiveClass.find(query)
        .populate('host', 'name email avatar')
        .populate('attendees.userId', 'name email avatar')
        .sort({ scheduledAt: -1 });

    res.json({
        success: true,
        data: liveClasses,
    });
})

// Get single live class
export const getLiveClassById = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id)
        .populate('courseId', 'title')
        .populate('host', 'name email avatar')
        .populate('attendees.userId', 'name email avatar');

    if (!liveClass) {
        throw new AppError('Live class not found', 404);
    }

    res.json({
        success: true,
        data: liveClass,
    });
})

// Schedule live class
export const scheduleLiveClass = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        type,
        scheduledAt,
        duration,
        meetingLink,
        meetingId,
        password,
        maxAttendees,
    } = req.body;

    const course = await Course.findById(req.params.courseId);

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    const liveClass = await LiveClass.create({
        courseId: req.params.courseId,
        title,
        description,
        type,
        scheduledAt,
        duration,
        meetingLink,
        meetingId,
        password,
        host: req.user._id,
        maxAttendees,
    });

    // Notify all enrolled students
    if (course.students.length > 0) {
        await notificationService.createBulkNotifications(
            course.students,
            NotificationType.LIVE_CLASS_SCHEDULED,
            'Live Class Scheduled',
            `A new live class "${title}" has been scheduled for ${new Date(scheduledAt).toLocaleString()}`,
            { courseId: course._id, liveClassId: liveClass._id },
            'HIGH'
        );

        // Send email to all students
        for (const studentId of course.students) {
            const student = await user.findById(studentId);
            if (student) {
                emailService.sendLiveClassReminder(
                    student.email,
                    student.name,
                    title,
                    scheduledAt,
                    meetingLink
                );
            }
        }
    }

    await liveClass.populate('host', 'name email');

    res.status(201).json({
        success: true,
        message: 'Live class scheduled successfully',
        data: liveClass,
    });
})

// Update live class
export const updateLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
        throw new AppError('Live class not found', 404);
    }

    const allowedUpdates = [
        'title',
        'description',
        'scheduledAt',
        'duration',
        'meetingLink',
        'password',
        'maxAttendees',
        'status',
        'notes',
    ];

    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            (liveClass)[field] = req.body[field];
        }
    });

    await liveClass.save();

    res.json({
        success: true,
        message: 'Live class updated successfully',
        data: liveClass,
    });
})

// Delete/Cancel live class
export const cancelLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id)
        .populate('courseId', 'students');

    if (!liveClass) {
        throw new AppError('Live class not found', 404);
    }

    liveClass.status = ClassStatus.CANCELLED;
    await liveClass.save();

    // Notify attendees
    const course = await Course.findById(liveClass.courseId);
    if (course && course.students.length > 0) {
        await notificationService.createBulkNotifications(
            course.students,
            NotificationType.ANNOUNCEMENT,
            'Live Class Cancelled',
            `The live class "${liveClass.title}" scheduled for ${liveClass.scheduledAt.toLocaleString()} has been cancelled`,
            { courseId: course._id, liveClassId: liveClass._id },
            'URGENT'
        );
    }

    res.json({
        success: true,
        message: 'Live class cancelled successfully',
    });
})

// Join live class
export const joinLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
        throw new AppError('Live class not found', 404);
    }

    if (liveClass.status === ClassStatus.CANCELLED) {
        throw new AppError('This class has been cancelled', 400);
    }

    // Check if already joined
    const existingAttendee = liveClass.attendees.find(
        a => a.userId.toString() === req.user._id.toString()
    );

    if (existingAttendee) {
        existingAttendee.joinedAt = new Date();
        existingAttendee.isPresent = true;
    } else {
        liveClass.attendees.push({
            userId: req.user._id,
            joinedAt: new Date(),
            isPresent: true,
        });
    }

    // Update status if first join
    if (liveClass.status === ClassStatus.SCHEDULED) {
        liveClass.status = ClassStatus.ONGOING;
    }

    await liveClass.save();

    res.json({
        success: true,
        message: 'Joined live class successfully',
        data: {
            meetingLink: liveClass.meetingLink,
            meetingId: liveClass.meetingId,
            password: liveClass.password,
        },
    });
})

// Leave live class
export const leaveLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
        throw new AppError('Live class not found', 404);
    }

    const attendee = liveClass.attendees.find(
        a => a.userId.toString() === req.user._id.toString()
    );

    if (attendee) {
        attendee.leftAt = new Date();
        if (attendee.joinedAt) {
            attendee.duration = Math.floor(
                (attendee.leftAt.getTime() - attendee.joinedAt.getTime()) / 1000 / 60
            );
        }
    }

    await liveClass.save();

    res.json({
        success: true,
        message: 'Left live class successfully',
    });
})