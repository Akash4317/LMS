import mongoose, { Schema } from 'mongoose';

const lectureSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Lecture title is required'],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
    },
    thumbnailUrl: String,
    duration: {
      type: Number, // in seconds
      required: true,
      min: 0,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    syllabusId: {
      type: Schema.Types.ObjectId,
      ref: 'Syllabus',
      required: true,
    },
    topicId: {
      type: Schema.Types.ObjectId,
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    transcript: String,
    attachments: [
      {
        title: String,
        url: String,
        size: Number,
        type: String,
      },
    ],
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadProgress: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    cloudinaryPublicId: String,
    qualityOptions: [
      {
        quality: {
          type: String,
          enum: ['360p', '480p', '720p', '1080p'],
        },
        url: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
lectureSchema.index({ courseId: 1, syllabusId: 1, order: 1 });
lectureSchema.index({ isPublished: 1, isFree: 1 });
lectureSchema.index({ title: 'text', description: 'text' });

// Instance method: increment views
lectureSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

export default mongoose.model('Lecture', lectureSchema);
