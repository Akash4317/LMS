import mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const NotificationType = Object.freeze({
  ASSIGNMENT_CREATED: 'ASSIGNMENT_CREATED',
  ASSIGNMENT_GRADED: 'ASSIGNMENT_GRADED',
  ASSIGNMENT_DUE_SOON: 'ASSIGNMENT_DUE_SOON',
  LIVE_CLASS_SCHEDULED: 'LIVE_CLASS_SCHEDULED',
  LIVE_CLASS_REMINDER: 'LIVE_CLASS_REMINDER',
  LIVE_CLASS_STARTED: 'LIVE_CLASS_STARTED',
  COURSE_ENROLLED: 'COURSE_ENROLLED',
  NEW_LECTURE_ADDED: 'NEW_LECTURE_ADDED',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  ATTENDANCE_MARKED: 'ATTENDANCE_MARKED',
  STUDENT_SUBMITTED_ASSIGNMENT: 'STUDENT_SUBMITTED_ASSIGNMENT',
  COURSE_COMPLETED: 'COURSE_COMPLETED',
  CERTIFICATE_GENERATED: 'CERTIFICATE_GENERATED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  SYSTEM: 'SYSTEM',
});

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    actionUrl: String,
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    expiresAt: Date,
  },
  { timestamps: true }
);

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

export default mongoose.model('Notification', notificationSchema);
