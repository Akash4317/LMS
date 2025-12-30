import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const lectureProgressSchema = new Schema({
  lectureId: {
    type: Schema.Types.ObjectId,
    ref: 'Lecture',
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  watchedDuration: {
    type: Number,
    default: 0,
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
});

const progressSchema = new Schema(
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
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lecturesProgress: [lectureProgressSchema],
    completedLectures: {
      type: Number,
      default: 0,
    },
    totalLectures: {
      type: Number,
      default: 0,
    },
    assignmentsSubmitted: {
      type: Number,
      default: 0,
    },
    totalAssignments: {
      type: Number,
      default: 0,
    },
    attendancePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    averageGrade: {
      type: Number,
      min: 0,
      max: 100,
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateUrl: String,
    certificateIssuedAt: Date,
    notes: [
      {
        lectureId: {
          type: Schema.Types.ObjectId,
          ref: 'Lecture',
        },
        content: {
          type: String,
          maxlength: 5000,
        },
        timestamp: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    bookmarks: [
      {
        lectureId: {
          type: Schema.Types.ObjectId,
          ref: 'Lecture',
        },
        timestamp: Number,
        title: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
progressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
progressSchema.index({ courseId: 1, completionPercentage: -1 });
progressSchema.index({ studentId: 1, lastAccessedAt: -1 });

// Methods
progressSchema.methods.calculateCompletion = function () {
  if (this.totalLectures === 0) {
    this.completionPercentage = 0;
    return this.completionPercentage;
  }

  this.completedLectures = this.lecturesProgress.filter(lp => lp.completed).length;
  this.completionPercentage = Math.round(
    (this.completedLectures / this.totalLectures) * 100
  );

  return this.completionPercentage;
};

progressSchema.methods.updateLectureProgress = function (
  lectureId,
  watchedDuration,
  totalDuration
) {
  const lectureProgress = this.lecturesProgress.find(lp =>
    lp.lectureId.equals(lectureId)
  );

  const isCompleted = watchedDuration >= totalDuration * 0.9;

  if (lectureProgress) {
    lectureProgress.watchedDuration = watchedDuration;
    lectureProgress.lastWatchedAt = new Date();
    if (isCompleted && !lectureProgress.completed) {
      lectureProgress.completed = true;
      lectureProgress.completedAt = new Date();
    }
  } else {
    this.lecturesProgress.push({
      lectureId,
      watchedDuration,
      lastWatchedAt: new Date(),
      completed: isCompleted,
      completedAt: isCompleted ? new Date() : undefined,
    });
  }

  this.calculateCompletion();
  this.lastAccessedAt = new Date();

  return this.save();
};

export default mongoose.model('Progress', progressSchema);
