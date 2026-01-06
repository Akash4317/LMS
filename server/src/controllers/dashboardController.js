import user, { UserRole } from '../models/user.js';
import Progress from '../models/progress.js';
import Attendance from '../models/attendence.js';
import Assignment from '../models/assignment.js';
import Course from '../models/course.js';
import LiveClass from '../models/liveClass.js';
import Notification from '../models/notification.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Get Super Admin Dashboard
export const getSuperAdminDashboard = asyncHandler(async (req, res) => {
    const [
        totalInstitutes,
        totalUsers,
        totalCourses,
        recentUsers,
        usersByRole,
    ] = await Promise.all([
        require('../models/institute.js').default.countDocuments(),
        user.countDocuments(),
        Course.countDocuments(),
        user.find()
            .select('name email role createdAt avatar')
            .sort({ createdAt: -1 })
            .limit(10),
        user.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
        ]),
    ]);

    res.json({
        success: true,
        data: {
            totalInstitutes,
            totalUsers,
            totalCourses,
            usersByRole,
            recentUsers,
        },
    });
});

// Get Admin/Teacher Dashboard
export const getAdminDashboard = asyncHandler(async (req, res) => {
    const teacherId = req.user._id;

    const [
        myCourses,
        totalStudents,
        upcomingClasses,
        pendingAssignments,
        recentActivity,
    ] = await Promise.all([
        Course.find({ teachers: teacherId })
            .select('title students createdAt thumbnail')
            .lean(),
        Course.aggregate([
            { $match: { teachers: teacherId } },
            { $unwind: '$students' },
            { $group: { _id: null, count: { $sum: 1 } } },
        ]),
        LiveClass.find({
            host: teacherId,
            scheduledAt: { $gte: new Date() },
            status: 'SCHEDULED',
        })
            .populate('courseId', 'title')
            .sort({ scheduledAt: 1 })
            .limit(5),
        Assignment.aggregate([
            { $match: { createdBy: teacherId } },
            { $unwind: '$submissions' },
            { $match: { 'submissions.status': 'PENDING' } },
            { $group: { _id: null, count: { $sum: 1 } } },
        ]),
        Notification.find({ userId: teacherId })
            .sort({ createdAt: -1 })
            .limit(10),
    ]);

    const coursesWithStats = myCourses.map(course => ({
        ...course,
        studentCount: course.students.length,
    }));

    res.json({
        success: true,
        data: {
            totalCourses: myCourses.length,
            totalStudents: totalStudents[0]?.count || 0,
            courses: coursesWithStats,
            upcomingClasses,
            pendingSubmissions: pendingAssignments[0]?.count || 0,
            recentActivity,
        },
    });
})

// Get Student Dashboard
export const getStudentDashboard = asyncHandler(async (req, res) => {
    const studentId = req.user._id;

    const [
        enrolledCourses,
        progressData,
        upcomingClasses,
        pendingAssignments,
        recentGrades,
        notifications,
    ] = await Promise.all([
        Course.find({ students: studentId, isPublished: true })
            .populate('teachers', 'name avatar')
            .select('title description thumbnail category level')
            .lean(),
        Progress.find({ studentId })
            .populate('courseId', 'title')
            .lean(),
        LiveClass.find({
            'attendees.userId': studentId,
            scheduledAt: { $gte: new Date() },
            status: 'SCHEDULED',
        })
            .populate('courseId', 'title')
            .populate('host', 'name')
            .sort({ scheduledAt: 1 })
            .limit(5),
        Assignment.find({
            'submissions.studentId': { $ne: studentId },
            status: 'PUBLISHED',
            dueDate: { $gte: new Date() },
        })
            .populate('courseId', 'title')
            .sort({ dueDate: 1 })
            .limit(5),
        Assignment.find({
            'submissions.studentId': studentId,
            'submissions.status': 'GRADED',
        })
            .select('title submissions courseId')
            .populate('courseId', 'title')
            .sort({ 'submissions.gradedAt': -1 })
            .limit(5),
        Notification.find({ userId: studentId, isRead: false })
            .sort({ createdAt: -1 })
            .limit(10),
    ]);

    // Merge course data with progress
    const coursesWithProgress = enrolledCourses.map(course => {
        const progress = progressData.find(
            p => p.courseId._id.toString() === course._id.toString()
        );
        return {
            ...course,
            progress: progress?.completionPercentage || 0,
            lastAccessed: progress?.lastAccessedAt,
        };
    });

    // Calculate overall stats
    const totalCompletion = progressData.reduce(
        (sum, p) => sum + p.completionPercentage,
        0
    );
    const averageCompletion = progressData.length > 0
        ? totalCompletion / progressData.length
        : 0;

    const totalAttendance = progressData.reduce(
        (sum, p) => sum + p.attendancePercentage,
        0
    );
    const averageAttendance = progressData.length > 0
        ? totalAttendance / progressData.length
        : 0;

    res.json({
        success: true,
        data: {
            enrolledCourses: coursesWithProgress,
            stats: {
                totalCourses: enrolledCourses.length,
                averageCompletion: averageCompletion.toFixed(2),
                averageAttendance: averageAttendance.toFixed(2),
            },
            upcomingClasses,
            pendingAssignments,
            recentGrades,
            unreadNotifications: notifications.length,
            notifications,
        },
    });
})

// Get Parent Dashboard
export const getParentDashboard = asyncHandler(async (req, res) => {
    const parent = await user.findById(req.user._id).populate('linkedStudents');

    if (!parent || !parent.linkedStudents || parent.linkedStudents.length === 0) {
        return res.json({
            success: true,
            data: {
                message: 'No linked students found',
                students: [],
            },
        });
    }

    const studentsData = await Promise.all(
        parent.linkedStudents.map(async (student) => {
            const [enrolledCourses, progress, attendance, assignments] = await Promise.all([
                Course.find({ students: student._id })
                    .select('title')
                    .lean(),
                Progress.find({ studentId: student._id })
                    .populate('courseId', 'title')
                    .lean(),
                Attendance.find({ studentId: student._id }),
                Assignment.find({ 'submissions.studentId': student._id })
                    .select('title submissions')
                    .lean(),
            ]);

            const avgCompletion = progress.length > 0
                ? progress.reduce((sum, p) => sum + p.completionPercentage, 0) / progress.length
                : 0;

            const totalAttendance = attendance.length;
            const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
            const attendancePercentage = totalAttendance > 0
                ? (presentCount / totalAttendance) * 100
                : 0;

            const gradedAssignments = assignments.filter(
                a => a.submissions.find((s) => s.studentId.toString() === student._id.toString())?.status === 'GRADED'
            );

            return {
                student: {
                    id: student._id,
                    name: student.name,
                    email: student.email,
                    avatar: student.avatar,
                },
                stats: {
                    enrolledCourses: enrolledCourses.length,
                    averageCompletion: avgCompletion.toFixed(2),
                    attendancePercentage: attendancePercentage.toFixed(2),
                    completedAssignments: gradedAssignments.length,
                },
                recentCourses: progress.slice(0, 3),
            };
        })
    );

    res.json({
        success: true,
        data: {
            students: studentsData,
        },
    });
})

//  Get analytics data
export const getAnalytics = asyncHandler(async (req, res) => {
    const { courseId, startDate, endDate } = req.query;

    const query = {};

    if (courseId) {
        query.courseId = courseId;
    }

    if (req.user?.role === UserRole.ADMIN) {
        const courses = await Course.find({ teachers: req.user._id }).select('_id');
        query.courseId = { $in: courses.map(c => c._id) };
    }

    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);

    const [
        enrollmentTrend,
        completionRates,
        attendanceStats,
    ] = await Promise.all([
        Course.aggregate([
            { $match: query },
            { $unwind: '$students' },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 },
                }
            },
            { $sort: { _id: 1 } },
        ]),
        Progress.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $lt: ['$completionPercentage', 25] }, then: '0-25%' },
                                { case: { $lt: ['$completionPercentage', 50] }, then: '25-50%' },
                                { case: { $lt: ['$completionPercentage', 75] }, then: '50-75%' },
                                { case: { $lte: ['$completionPercentage', 100] }, then: '75-100%' },
                            ],
                            default: 'Unknown',
                        },
                    },
                    count: { $sum: 1 },
                }
            },
        ]),
        Attendance.aggregate([
            { $match: { ...query, ...(Object.keys(dateQuery).length && { date: dateQuery }) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                }
            },
        ]),
    ]);

    res.json({
        success: true,
        data: {
            enrollmentTrend,
            completionRates,
            attendanceStats,
        },
    });

})