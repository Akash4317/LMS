import mongoose, { Schema } from 'mongoose';

const replySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 3000,
    },
    attachments: [String],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

const discussionSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lectureId: {
      type: Schema.Types.ObjectId,
      ref: 'Lecture',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
    attachments: [String],
    tags: [String],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replies: [replySchema],
    isPinned: {
      type: Boolean,
      default: false,
    },
    isSolved: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
discussionSchema.index({ courseId: 1, createdAt: -1 });
discussionSchema.index({ lectureId: 1 });
discussionSchema.index({ userId: 1 });
discussionSchema.index({ title: 'text', content: 'text', tags: 'text' });

export default mongoose.model('Discussion', discussionSchema);