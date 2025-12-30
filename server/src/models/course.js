import mongoose, { Schema } from 'mongoose';

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      minlength: 10,
      maxlength: 2000,
    },
    thumbnail: {
      type: String,
    },
    instituteId: {
      type: Schema.Types.ObjectId,
      ref: 'Institute',
      required: true,
    },
    teachers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    category: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER',
    },
    duration: {
      type: Number, // in hours
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    enrollmentLimit: {
      type: Number,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    tags: {
      type: [String],
      default: [],
    },
    syllabus: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Syllabus',
      },
    ],
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
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ instituteId: 1, isPublished: 1 });
courseSchema.index({ teachers: 1 });
courseSchema.index({ students: 1 });
courseSchema.index({ category: 1, level: 1 });

// Virtual for enrollment count
courseSchema.virtual('enrollmentCount').get(function () {
  return this.students?.length || 0;
});

export default mongoose.model('Course', courseSchema);
