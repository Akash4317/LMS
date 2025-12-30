import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// user roles 
export const UserRole = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    STUDENT: 'STUDENT',
    PARENT: 'PARENT'
}

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 8,
            select: false,
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.STUDENT,
            required: true,
        },
        avatar: {
            type: String,
            default: null,
        },
        phone: {
            type: String,
            match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number'],
        },
        linkedStudents: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        instituteId: {
            type: Schema.Types.ObjectId,
            ref: 'Institute',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        lastLogin: {
            type: Date,
        },
        refreshToken: {
            type: String,
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpire: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// mongo indexing
userSchema.index({ email: 11 });
userSchema.index({ role: 11, instituteId: 1 });
userSchema.index({ linkedStudents: 1 })

// pre hashing passwords
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// compare password
userSchema.methods.comparePassword = async function (Password) {
    return bcrypt.compare(password, this.password);
}

export default mongoose.model('user' , userSchema);