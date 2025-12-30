import mongoose, { Schema } from 'mongoose';

const topicSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  lectures: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Lecture',
    },
  ],
  resources: [
    {
      title: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['PDF', 'DOC', 'VIDEO', 'LINK', 'OTHER'],
        default: 'OTHER',
      },
    },
  ],
  estimatedDuration: {
    type: Number, // in minutes
  },
});

/**
 * Syllabus Schema
 */
const syllabusSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    topics: [topicSchema],
    isPublished: {
      type: Boolean,
      default: false,
    },
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
syllabusSchema.index({ courseId: 1, order: 1 });
syllabusSchema.index({ isPublished: 1 });

export default mongoose.model('Syllabus', syllabusSchema);
