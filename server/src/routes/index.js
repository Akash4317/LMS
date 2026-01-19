import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validation.js';
import { upload, videoUpload, documentUpload } from '../middleware/upload.js';
import { UserRole } from '../models/user.js';

// Import controllers
import * as authController from '../controllers/authController.js';
import * as userController from '../controllers/userController.js';
import * as courseController from '../controllers/courseController.js';
import * as syllabusController from '../controllers/syllabusController.js';
import * as lectureController from '../controllers/lectureController.js';
import * as assignmentController from '../controllers/assignmentController.js';
import * as liveClassController from '../controllers/liveClassController.js';
import * as attendanceController from '../controllers/attendanceController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as instituteController from '../controllers/instituteController.js';

const router = Router();

// Auth routes
router.post('/auth/register',
    validate([
        body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    ]),
    authController.register
)
router.post('/auth/login',
    validate([
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
    ]),
    authController.login
)
router.post('/auth/refresh-token', authController.refreshToken);
router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/me',authenticate, authController.getMe);
router.put('/auth/profile', authenticate, authController.updateProfile);
router.put('/auth/change-password', authenticate, authController.changePassword);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password/:token', authController.resetPassword);
router.get('/auth/verify-email/:token', authController.verifyEmail);

// user routes
router.get('/users', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), userController.getAllUsers);
router.get('/users/stats', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), userController.getUserStats);
router.get('/users/:id', authenticate, userController.getUserById);
router.post(
    '/users',
    authenticate,
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    userController.createUser
);
router.post(
    '/users/bulk-create',
    authenticate,
    authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    userController.bulkCreateUsers
);
router.put('/users/:id', authenticate, userController.updateUser);
router.delete('/users/:id', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), userController.deleteUser);
router.post('/users/avatar', authenticate, upload.single('avatar'), userController.uploadAvatar);
router.post('/users/link-student', authenticate, authorize(UserRole.PARENT, UserRole.ADMIN), userController.linkStudentToParent);
router.delete('/users/unlink-student/:studentId', authenticate, authorize(UserRole.PARENT, UserRole.ADMIN), userController.unlinkStudentFromParent);

// course routes
router.get('/courses', optionalAuth, courseController.getAllCourses);
router.get('/courses/my-courses', authenticate, authorize(UserRole.STUDENT), courseController.getMyCourses);
router.get('/courses/teaching', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), courseController.getTeachingCourses);
router.get('/courses/:id', optionalAuth, courseController.getCourseById);
router.get('/courses/:id/stats', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), courseController.getCourseStats);
router.get('/courses/:id/students', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), courseController.getEnrolledStudents);

router.post(
    '/courses',
    authenticate,
    authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    validate([
        body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
        body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
        body('category').notEmpty().withMessage('Category is required'),
    ]),
    courseController.createCourse
);

router.put('/courses/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), courseController.updateCourse);
router.delete('/courses/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), courseController.deleteCourse);

router.post('/courses/:id/thumbnail', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), upload.single('thumbnail'), courseController.uploadThumbnail);
router.post('/courses/:id/enroll', authenticate, authorize(UserRole.STUDENT), courseController.enrollInCourse);
router.delete('/courses/:id/enroll', authenticate, courseController.unenrollFromCourse);

router.post('/courses/:id/teachers', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), courseController.addTeacherToCourse);
router.delete('/courses/:id/teachers/:teacherId', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), courseController.removeTeacherFromCourse);


// syllabus routes
router.get('/courses/:courseId/syllabus', optionalAuth, syllabusController.getCourseSyllabus);
router.get('/syllabus/:id', optionalAuth, syllabusController.getSyllabusById);
router.post('/courses/:courseId/syllabus', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), syllabusController.createSyllabus);
router.put('/syllabus/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), syllabusController.updateSyllabus);
router.delete('/syllabus/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), syllabusController.deleteSyllabus);

router.post('/syllabus/:id/topics', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), syllabusController.addTopic);
router.put('/syllabus/:id/topics/:topicId', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), syllabusController.updateTopic);
router.delete('/syllabus/:id/topics/:topicId', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), syllabusController.deleteTopic);


// lecture routes
router.get('/courses/:courseId/lectures', authenticate, lectureController.getCourseLectures);
router.get('/lectures/:id', authenticate, lectureController.getLectureById);

router.post('/courses/:courseId/lectures', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), lectureController.createLecture);
router.post('/lectures/:id/video', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), videoUpload.single('video'), lectureController.uploadVideo);
router.put('/lectures/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), lectureController.updateLecture);
router.delete('/lectures/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), lectureController.deleteLecture);

router.post('/lectures/:id/progress', authenticate, authorize(UserRole.STUDENT), lectureController.trackLectureProgress);
router.post('/lectures/:id/notes', authenticate, authorize(UserRole.STUDENT), lectureController.addLectureNote);
router.post('/lectures/:id/bookmarks', authenticate, authorize(UserRole.STUDENT), lectureController.addBookmark);


// assignment routes
router.get('/courses/:courseId/assignments', authenticate, assignmentController.getCourseAssignments);
router.get('/assignments/:id', authenticate, assignmentController.getAssignmentById);

router.post('/courses/:courseId/assignments', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), assignmentController.createAssignment);
router.put('/assignments/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), assignmentController.updateAssignment);
router.post('/assignments/:id/publish', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), assignmentController.publishAssignment);
router.delete('/assignments/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), assignmentController.deleteAssignment);

router.post('/assignments/:id/submit', authenticate, authorize(UserRole.STUDENT), documentUpload.array('files', 5), assignmentController.submitAssignment);
router.post('/assignments/:id/grade/:submissionId', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), assignmentController.gradeAssignment);


// live class routes
router.get('/courses/:courseId/live-classes', authenticate, liveClassController.getCourseLiveClasses);
router.get('/live-classes/:id', authenticate, liveClassController.getLiveClassById);

router.post('/courses/:courseId/live-classes', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), liveClassController.scheduleLiveClass);
router.put('/live-classes/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), liveClassController.updateLiveClass);
router.delete('/live-classes/:id', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), liveClassController.cancelLiveClass);

router.post('/live-classes/:id/join', authenticate, liveClassController.joinLiveClass);
router.post('/live-classes/:id/leave', authenticate, liveClassController.leaveLiveClass);
router.post('/live-classes/:liveClassId/mark-attendance', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), attendanceController.autoMarkAttendanceFromLiveClass);


// attendance routes
router.get('/courses/:courseId/attendance', authenticate, attendanceController.getCourseAttendance);
router.get('/attendance/student/:studentId/course/:courseId', authenticate, attendanceController.getStudentAttendanceSummary);

router.post('/courses/:courseId/attendance', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), attendanceController.markAttendance);
router.post('/courses/:courseId/attendance/bulk', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), attendanceController.bulkMarkAttendance);


// dashboard routes
router.get('/dashboard/super-admin', authenticate, authorize(UserRole.SUPER_ADMIN), dashboardController.getSuperAdminDashboard);
router.get('/dashboard/admin', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), dashboardController.getAdminDashboard);
router.get('/dashboard/student', authenticate, authorize(UserRole.STUDENT), dashboardController.getStudentDashboard);
router.get('/dashboard/parent', authenticate, authorize(UserRole.PARENT), dashboardController.getParentDashboard);
router.get('/dashboard/analytics', authenticate, dashboardController.getAnalytics);


// institute routes
router.get('/institutes', authenticate, authorize(UserRole.SUPER_ADMIN), instituteController.getAllInstitutes);
router.get('/institutes/:id', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), instituteController.getInstituteById);
router.post(
    '/institutes',
    authenticate,
    authorize(UserRole.SUPER_ADMIN),
    validate([
        body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('contactEmail').isEmail().withMessage('Please provide a valid email'),
        body('contactPhone').notEmpty().withMessage('Contact phone is required'),
    ]),
    instituteController.createInstitute
);
router.put('/institutes/:id', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), instituteController.updateInstitute);
router.delete('/institutes/:id', authenticate, authorize(UserRole.SUPER_ADMIN), instituteController.deleteInstitute);
router.post('/institutes/:id/logo', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), upload.single('logo'), instituteController.uploadLogo);
router.post('/institutes/:id/admins', authenticate, authorize(UserRole.SUPER_ADMIN), instituteController.addAdmin);
router.delete('/institutes/:id/admins/:adminId', authenticate, authorize(UserRole.SUPER_ADMIN), instituteController.removeAdmin);
router.get('/institutes/:id/stats', authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), instituteController.getInstituteStats);


// notification routes
router.get('/notifications', authenticate, async (req, res) => {
    const Notification = require('../models/notification').default;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

    const total = await Notification.countDocuments({ userId: req.user._id });
    const unread = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    res.json({
        success: true,
        data: notifications,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
        unreadCount: unread,
    });
});

router.put('/notifications/:id/read', authenticate, async (req, res) => {
    const Notification = require('../models/notification').default;
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'Notification marked as read' });
});

router.put('/notifications/read-all', authenticate, async (req, res) => {
    const Notification = require('../models/notification').default;
    await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
});

export default router;