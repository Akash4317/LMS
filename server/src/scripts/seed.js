import mongoose from 'mongoose';
import dotenv from 'dotenv';
import user, { UserRole } from '../models/user';
import Institute from '../models/Institute';
import logger from '../utils/logger';

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Connected to MongoDB');

        // Clear existing data
        await user.deleteMany({});
        await Institute.deleteMany({});

        // Create Super Admin
        const superAdmin = await user.create({
            name: 'Super Admin',
            email: 'superadmin@lms.com',
            password: 'password123',
            role: UserRole.SUPER_ADMIN,
            isActive: true,
            isEmailVerified: true,
        });

        // Create Institute
        const institute = await Institute.create({
            name: 'Demo Institute',
            contactEmail: 'contact@demo.com',
            contactPhone: '+1234567890',
            admins: [],
            students: [],
        });

        // Create Admin
        const admin = await User.create({
            name: 'John Admin',
            email: 'admin@demo.com',
            password: 'password123',
            role: UserRole.ADMIN,
            instituteId: institute._id,
            isActive: true,
            isEmailVerified: true,
        });

        institute.admins.push(admin._id);

        // Create Students
        const students = [];
        for (let i = 1; i <= 5; i++) {
            const student = await user.create({
                name: `Student ${i}`,
                email: `student${i}@demo.com`,
                password: 'password123',
                role: UserRole.STUDENT,
                instituteId: institute._id,
                isActive: true,
                isEmailVerified: true,
            });
            students.push(student._id);
        }

        institute.students.push(...students);
        await institute.save();

        // Create Parent
        const parent = await user.create({
            name: 'Parent User',
            email: 'parent@demo.com',
            password: 'password123',
            role: UserRole.PARENT,
            linkedStudents: [students[0]],
            isActive: true,
            isEmailVerified: true,
        });

        logger.info('✅ Seed data created successfully');
        logger.info(`Super Admin: superadmin@lms.com / password123`);
        logger.info(`Admin: admin@demo.com / password123`);
        logger.info(`Students: student1@demo.com - student5@demo.com / password123`);
        logger.info(`Parent: parent@demo.com / password123`);

        process.exit(0);
    } catch (error) {
        logger.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();