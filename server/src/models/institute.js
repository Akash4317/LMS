import mongoose, { Schema } from 'mongoose';

const instituteSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Institute name is required'],
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    logo: {
      type: String,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    contactEmail: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    contactPhone: {
      type: String,
      required: true,
    },
    website: {
      type: String,
    },
    admins: [
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
    isActive: {
      type: Boolean,
      default: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
        default: 'FREE',
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      maxStudents: {
        type: Number,
        default: 50,
      },
      maxCourses: {
        type: Number,
        default: 5,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
instituteSchema.index({ name: 'text', description: 'text' });
instituteSchema.index({ admins: 1 });
instituteSchema.index({ isActive: 1 });

export default mongoose.model('Institute', instituteSchema);
