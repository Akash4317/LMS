import Lecture from '../models/lecture';
import Progress from '../models/progress';
import notificationService from '../services/notificationService';
import { NotificationType } from '../models/notification';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import uploadService from '../services/uploadService';

//  Get all lectures for a course
export const getCourseLectures = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const lectures = await Lecture.find({ courseId, isPublished: true })
        .populate('uploadedBy', 'name email')
        .sort({ order: 1 });

    res.json({
        success: true,
        data: lectures,
    });
})

// Get single lecture
export const getLectureById = asyncHandler(async (req, res) => {
    const lecture = await Lecture.findById(req.params.id)
        .populate('courseId', 'title description students')
        .populate('uploadedBy', 'name email avatar');

    if (!lecture) {
        throw new AppError('Lecture not found', 404);
    }

    // Check if user has access
    const course = await Course.findById(lecture.courseId);
    const isEnrolled = course?.students.some(
        studentId => studentId.toString() === req.user._id.toString()
    );
    const isTeacher = course?.teachers.some(
        teacherId => teacherId.toString() === req.user._id.toString()
    );

    if (!lecture.isFree && !isEnrolled && !isTeacher) {
        throw new AppError('You need to enroll in this course to access this lecture', 403);
    }

    // Increment views
    lecture.views += 1;
    await lecture.save();

    res.json({
        success: true,
        data: lecture,
    });
})

// Create lecture
export const createLecture = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        videoUrl,
        thumbnailUrl,
        duration,
        syllabusId,
        topicId,
        order,
        isFree,
        transcript,
    } = req.body;

    const course = await Course.findById(req.params.courseId);

    if (!course) {
        throw new AppError('Course not found', 404);
    }

    const lecture = await Lecture.create({
        title,
        description,
        videoUrl,
        thumbnailUrl,
        duration,
        courseId: req.params.courseId,
        syllabusId,
        topicId,
        order,
        isFree: isFree || false,
        transcript,
        uploadedBy: req.user._id,
    });

    // Add lecture to syllabus topic
    if (syllabusId && topicId) {
        const syllabus = await Syllabus.findById(syllabusId);
        if (syllabus) {
            const topic = syllabus.topics.id(topicId);
            if (topic) {
                topic.lectures.push(lecture._id);
                await syllabus.save();
            }
        }
    }

    // Update progress for all enrolled students
    await Progress.updateMany(
        { courseId: req.params.courseId },
        { $inc: { totalLectures: 1 } }
    );

    // Notify enrolled students
    const students = course.students;
    if (students.length > 0) {
        await notificationService.createBulkNotifications(
            students,
            NotificationType.NEW_LECTURE_ADDED,
            'New Lecture Added',
            `A new lecture "${title}" has been added to ${course.title}`,
            { courseId: course._id, lectureId: lecture._id },
            'MEDIUM'
        );
    }

    await lecture.populate('uploadedBy', 'name email');

    res.status(201).json({
        success: true,
        message: 'Lecture created successfully',
        data: lecture,
    });
})

// uploadVideo
export const uploadVideo = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new AppError('Please upload a video file', 400);
    }

    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
        throw new AppError('Lecture not found', 404);
    }

    // Upload to cloudinary
    const result = await uploadService.uploadVideo(req.file, 'lms/lectures');

    // Delete old video
    if (lecture.cloudinaryPublicId) {
        await uploadService.deleteFile(lecture.cloudinaryPublicId, 'video');
    }

    lecture.videoUrl = result.url;
    lecture.cloudinaryPublicId = result.publicId;
    lecture.duration = result.duration || 0;
    lecture.uploadProgress = 100;
    await lecture.save();

    res.json({
        success: true,
        message: 'Video uploaded successfully',
        data: {
            url: result.url,
            duration: result.duration,
        },
    });
})

// Update lecture
export const updateLecture = asyncHandler(async (req, res) => {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
        throw new AppError('Lecture not found', 404);
    }

    const allowedUpdates = [
        'title',
        'description',
        'thumbnailUrl',
        'isPublished',
        'isFree',
        'order',
        'transcript',
    ];

    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            (lecture)[field] = req.body[field];
        }
    });

    await lecture.save();

    res.json({
        success: true,
        message: 'Lecture updated successfully',
        data: lecture,
    });
})

// Delete lecture
export const deleteLecture = asyncHandler(async (req, res) => {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
        throw new AppError('Lecture not found', 404);
    }

    // Delete video from cloudinary
    if (lecture.cloudinaryPublicId) {
        await uploadService.deleteFile(lecture.cloudinaryPublicId, 'video');
    }

    // Remove from syllabus
    if (lecture.syllabusId && lecture.topicId) {
        await Syllabus.findOneAndUpdate(
            { _id: lecture.syllabusId, 'topics._id': lecture.topicId },
            { $pull: { 'topics.$.lectures': lecture._id } }
        );
    }

    // Update progress
    await Progress.updateMany(
        { courseId: lecture.courseId },
        {
            $inc: { totalLectures: -1 },
            $pull: { 'lecturesProgress.lectureId': lecture._id }
        }
    );

    await lecture.deleteOne();

    res.json({
        success: true,
        message: 'Lecture deleted successfully',
    });
})

// Track lecture progress
export const trackLectureProgress = asyncHandler(async (req, res) => {
    const { watchedDuration } = req.body;

    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
        throw new AppError('Lecture not found', 404);
    }

    // Find or create progress
    let progress = await Progress.findOne({
        studentId: req.user._id,
        courseId: lecture.courseId,
    });

    if (!progress) {
        throw new AppError('You are not enrolled in this course', 403);
    }

    // Update lecture progress
    await progress.updateLectureProgress(
        lecture._id,
        watchedDuration,
        lecture.duration
    );

    res.json({
        success: true,
        message: 'Progress updated successfully',
        data: {
            completionPercentage: progress.completionPercentage,
            lectureCompleted: watchedDuration >= lecture.duration * 0.9,
        },
    });
})

// Add note to lecture
export const addLectureNote = asyncHandler(async (req, res) => {
    const { content, timestamp } = req.body;

    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
        throw new AppError('Lecture not found', 404);
    }
    const progress = await Progress.findOne({
        studentId: req.user._id,
        courseId: lecture.courseId,
    });

    if (!progress) {
        throw new AppError('You are not enrolled in this course', 403);
    }

    progress.notes = progress.notes || [];
    progress.notes.push({
        lectureId: lecture._id,
        content,
        timestamp: timestamp || 0,
        createdAt: new Date(),
    });

    await progress.save();

    res.status(201).json({
        success: true,
        message: 'Note added successfully',
        data: progress.notes[progress.notes.length - 1],
    });
})

// Add bookmark to lecture
export const addBookmark = asyncHandler(async (req, res) => {
    const { timestamp, title } = req.body;

    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
        throw new AppError('Lecture not found', 404);
    }

    const progress = await Progress.findOne({
        studentId: req.user._id,
        courseId: lecture.courseId,
    });

    if (!progress) {
        throw new AppError('You are not enrolled in this course', 403);
    }

    progress.bookmarks = progress.bookmarks || [];
    progress.bookmarks.push({
        lectureId: lecture._id,
        timestamp,
        title: title || `Bookmark at ${timestamp}s`,
        createdAt: new Date(),
    });

    await progress.save();

    res.status(201).json({
        success: true,
        message: 'Bookmark added successfully',
        data: progress.bookmarks[progress.bookmarks.length - 1],
    });
})