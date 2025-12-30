import mongoose, { Schema } from 'mongoose';

const announcementSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: ['INFO', 'WARNING', 'IMPORTANT', 'EVENT'],
      default: 'INFO',
    },
    target: {
      scope: {
        type: String,
        enum: ['ALL', 'INSTITUTE', 'COURSE', 'CUSTOM'],
        required: true,
      },
      instituteId: {
        type: Schema.Types.ObjectId,
        ref: 'Institute',
      },
      courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
      userIds: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      roles: [String],
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileSize: Number,
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
    expiresAt: Date,
    isPinned: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes
announcementSchema.index({ 'target.instituteId': 1, isPublished: 1, createdAt: -1 });
announcementSchema.index({ 'target.courseId': 1, isPublished: 1, createdAt: -1 });
announcementSchema.index({ isPinned: 1, publishedAt: -1 });
announcementSchema.index({ expiresAt: 1 });

export default mongoose.model('Announcement', announcementSchema);
