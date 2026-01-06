import Attendance, { AttendanceStatus } from '../models/attendence.js';
import Course from '../models/course.js';
import LiveClass from '../models/liveClass.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

// Mark attendance for a live class
export const markAttendance = asyncHandler(async (req, res) => {
    const { studentId, status, date, remarks, liveClassId } = req.body;

    const course = Course.findById(req.params.courseId);
    if (!course) {
        throw new AppError('Course not found', 404);
    }

    // Check if student is enrolled
    if (!course.students.some(id => id.toString() === studentId)) {
        throw new AppError('Student is not enrolled in this course', 400);
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
        studentId,
        courseId: req.params.courseId,
        date: attendanceDate,
    })

    if (existing) {
        existing.status = status;
        existing.remarks = remarks;
        existing.markedBy = req.user._id;
        existing.markedAt = new Date();
        await existing.save();

        return res.json({
            success: true,
            message: 'Attendance updated successfully',
            data: existing,
        });
    }

    const attendance = await Attendance.create({
        studentId,
        courseId: req.params.courseId,
        liveClassId,
        date: attendanceDate,
        status,
        remarks,
        markedBy: req.user._id,
        autoMarked: false,
    });

    res.status(201).json({
        success: true,
        message: 'Attendance marked successfully',
        data: attendance,
    });
})

// Get attendance records
export const getCourseAttendance = asyncHandler(async (req, res) => {
    const { startDate, endDate, studentId } = req.query;

    const query = { courseId: req.params.courseId };

    if (studentId) {
        query.studentId = studentId;
    }

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query).poulate('studentId', 'name email').poulate('markedBy', 'name email').sort({ date: -1 });

    res.json({
        success: true,
        data: attendance,
    });
})

// Get student attendance summary
export const getStudentAttendanceSummary = asyncHandler(async (req, res) => {
    const { studentId, courseId } = req.params;

    const attendance = await Attendance.find({ studentId, courseId });

    const total = attendance.length;
    const present = attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const absent = attendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
    const late = attendance.filter(a => a.status === AttendanceStatus.LATE).length;
    const excused = attendance.filter(a => a.status === AttendanceStatus.EXCUSED).length;

    const percentage = total > 0 ? (present / total) * 100 : 0;

    res.json({
        success: true,
        data: {
            total,
            present,
            absent,
            late,
            excused,
            percentage: percentage.toFixed(2),
            records: attendance,
        },
    });

})

// Bulk mark attendance
export const bulkMarkAttendance = asyncHandler(async (req, res) => {
    const { attendanceRecords, date, liveClassId } = req.body;

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
        throw new AppError('Please provide attendance records', 400);
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
        throw new AppError('Course not found', 404);
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const results = [];

    for (const record of attendanceRecords) {
        try {
            const existing = await Attendance.findOne({
                studentId: record.studentId,
                courseId: req.params.courseId,
                date: attendanceDate,
            });

            if (existing) {
                existing.status = record.status;
                existing.remarks = record.remarks;
                existing.markedBy = req.user._id;
                existing.markedAt = new Date();
                await existing.save();
                results.push({ studentId: record.studentId, updated: true });
            } else {
                await Attendance.create({
                    studentId: record.studentId,
                    courseId: req.params.courseId,
                    liveClassId,
                    date: attendanceDate,
                    status: record.status,
                    remarks: record.remarks,
                    markedBy: req.user._id,
                    autoMarked: false,
                });
                results.push({ studentId: record.studentId, created: true });
            }
        } catch (error) {
            results.push({ studentId: record.studentId, error: error.message });
        }
    }

    res.json({
        success: true,
        message: 'Bulk attendance marked successfully',
        data: results,
    });
})

// Auto-mark attendance from live class
export const autoMarkAttendanceFromLiveClass = asyncHandler(async (req, res) => {
    const liveClass = await LiveClass.findById(req.params.liveClassId).populate('courseId', 'students');
    if (!liveClass) {
        throw new AppError('Live class not found', 404);
    }
    const attendanceDate = new Date(liveClass.scheduledAt);
    attendanceDate.setHours(0, 0, 0, 0);

    const results = [];

    for (const attendee of liveClass.attendees) {
        try {
            const existing = await Attendance.findOne({
                studentId: attendee.userId,
                courseId: liveClass.courseId,
                date: attendanceDate,
            });

            const status = attendee.isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT;

            if (existing) {
                existing.status = status;
                existing.liveClassId = liveClass._id;
                existing.autoMarked = true;
                existing.markedBy = liveClass.host;
                existing.markedAt = new Date();
                await existing.save();
                results.push({ studentId: attendee.userId, updated: true });
            } else {
                await Attendance.create({
                    studentId: attendee.userId,
                    courseId: liveClass.courseId,
                    liveClassId: liveClass._id,
                    date: attendanceDate,
                    status,
                    markedBy: liveClass.host,
                    autoMarked: true,
                });
                results.push({ studentId: attendee.userId, created: true });
            }
        } catch (error) {
            results.push({ studentId: attendee.userId, error: error.message });
        }
    }

    res.json({
        success: true,
        message: 'Attendance auto-marked from live class',
        data: results,
    });
});