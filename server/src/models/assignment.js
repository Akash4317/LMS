import mongoose, { Schema } from 'mongoose';

// Enum equivalent in JS
const AssignmentStatus = {
    DRAFT: 'DRAFT',
    PUBLISHED: 'PUBLISHED',
    CLOSED: 'CLOSED',
};

const submissionSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    files: [
        {
            fileName: String,
            fileUrl: String,
            fileSize: Number,
            fileType: String,
        },
    ],
    textContent: String,
    marks: {
        type: Number,
        min: 0,
    },
    maxMarks: {
        type: Number,
        required: true,
    },
    feedback: String,
    gradedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    gradedAt: Date,
    status: {
        type: String,
        enum: ['PENDING', 'GRADED', 'RESUBMIT'],
        default: 'PENDING',
    },
});

const assignmentSchema = new Schema(
    {
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        syllabusId: {
            type: Schema.Types.ObjectId,
            ref: 'Syllabus',
        },
        title: {
            type: String,
            required: [true, 'Assignment title is required'],
            trim: true,
            minlength: 3,
            maxlength: 200,
        },
        description: {
            type: String,
            required: [true, 'Assignment description is required'],
            minlength: 10,
            maxlength: 5000,
        },
        instructions: {
            type: String,
            maxlength: 3000,
        },
        attachments: [
            {
                fileName: String,
                fileUrl: String,
                fileSize: Number,
            },
        ],
        dueDate: {
            type: Date,
            required: true,
        },
        maxMarks: {
            type: Number,
            required: true,
            min: 0,
        },
        passingMarks: {
            type: Number,
            min: 0,
        },
        allowLateSubmission: {
            type: Boolean,
            default: true,
        },
        latePenalty: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        maxFileSize: {
            type: Number,
            default: 10, // MB
        },
        allowedFileTypes: {
            type: [String],
            default: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'zip'],
        },
        status: {
            type: String,
            enum: Object.values(AssignmentStatus),
            default: AssignmentStatus.DRAFT,
        },
        submissions: [submissionSchema],
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
assignmentSchema.index({ courseId: 1, dueDate: -1 });
assignmentSchema.index({ status: 1, dueDate: -1 });
assignmentSchema.index({ 'submissions.studentId': 1 });

// Virtual: total submissions
assignmentSchema.virtual('submissionCount').get(function () {
    return this.submissions.length;
});

// prevent duplicate submission
assignmentSchema.index(
    { _id: 1, 'submissions.studentId': 1 },
    { unique: true }
);

// auto close assignment after due date 
assignmentSchema.pre('save', function () {
    if (this.dueDate < new Date()) {
        this.status = AssignmentStatus.CLOSED;
    }
})

// Virtual: graded submissions
assignmentSchema.virtual('gradedCount').get(function () {
    return this.submissions.filter(
        (submission) => submission.status === 'GRADED'
    ).length;
});

// auto calc pass fail
submissionSchema.virtual('isPassed').get(function () {
    return this.marks >= this.maxMarks * 0.4;
});


export default mongoose.model('Assignment', assignmentSchema);
