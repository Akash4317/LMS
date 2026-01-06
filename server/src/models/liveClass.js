import mongoose, { Schema } from 'mongoose';

// Enum equivalents (JS-safe)
const ClassType = {
    ONE_ON_ONE: 'ONE_ON_ONE',
    BATCH: 'BATCH',
};

export const ClassStatus = {
    SCHEDULED: 'SCHEDULED',
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};

const liveClassSchema = new Schema(
    {
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Class title is required'],
            trim: true,
            minlength: 3,
            maxlength: 200,
        },
        description: {
            type: String,
            maxlength: 1000,
        },
        type: {
            type: String,
            enum: Object.values(ClassType),
            required: true,
        },
        scheduledAt: {
            type: Date,
            required: true,
        },
        duration: {
            type: Number, // in minutes
            required: true,
            min: 15,
            max: 480, // 8 hours
        },
        endTime: Date,
        meetingLink: {
            type: String,
            required: true,
        },
        meetingId: String,
        password: String,
        host: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        attendees: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                joinedAt: Date,
                leftAt: Date,
                duration: Number,
                isPresent: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        maxAttendees: Number,
        status: {
            type: String,
            enum: Object.values(ClassStatus),
            default: ClassStatus.SCHEDULED,
        },
        recordingUrl: String,
        isRecorded: {
            type: Boolean,
            default: false,
        },
        notes: String,
        remindersent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
liveClassSchema.index({ courseId: 1, scheduledAt: -1 });
liveClassSchema.index({ host: 1, scheduledAt: -1 });
liveClassSchema.index({ 'attendees.userId': 1 });
liveClassSchema.index({ status: 1, scheduledAt: 1 });

// Virtual: present attendee count
liveClassSchema.virtual('attendeeCount').get(function () {
    return this.attendees.filter(a => a.isPresent).length;
});

// cal end time 
liveClassSchema.pre('save', function () {
    this.endTime = new Date(this.scheduledAt.getTime() + this.duration * 60000);
});


export default mongoose.model('LiveClass', liveClassSchema);
