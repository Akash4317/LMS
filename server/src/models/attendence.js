import mongoose, { Schema } from 'mongoose';

// Enum equivalent in JS
export const AttendanceStatus = {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    LATE: 'LATE',
    EXCUSED: 'EXCUSED',
};

const attendanceSchema = new Schema(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        liveClassId: {
            type: Schema.Types.ObjectId,
            ref: 'LiveClass',
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        status: {
            type: String,
            enum: Object.values(AttendanceStatus),
            required: true,
        },
        remarks: {
            type: String,
            maxlength: 500,
        },
        markedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        markedAt: {
            type: Date,
            default: Date.now,
        },
        autoMarked: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
attendanceSchema.index({ studentId: 1, courseId: 1, date: -1 });
attendanceSchema.index({ courseId: 1, date: -1 });
attendanceSchema.index({ liveClassId: 1 });

// Ensure unique attendance per student per course per day
attendanceSchema.index(
    { studentId: 1, courseId: 1, date: 1 },
    { unique: true }
);

// prevent duplicate attendence on same calender day
attendanceSchema.pre('save', function () {
    this.date.setHours(0, 0, 0, 0);
});

// auto mark student if not joined 
attendanceSchema.pre('save', function () {
    if (!this.status) {
        this.status = AttendanceStatus.ABSENT;
        this.autoMarked = true;
    }
});


export default mongoose.model('Attendance', attendanceSchema);
