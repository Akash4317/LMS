const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';

export const USER_ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    STUDENT: 'STUDENT',
    PARENT: 'PARENT',
} as const;

export const COURSE_LEVELS = {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
} as const;

export const ASSIGNMENT_STATUSES = {
    DRAFT: 'Draft',
    PUBLISHED: 'Published',
    CLOSED: 'Closed',
} as const;

export const ATTENDANCE_STATUS = {
    PRESENT: 'Present',
    ABSENT: 'Absent',
    LATE: 'Late',
    EXCUSED: 'Excused',
} as const;

export const CLASS_STATUS = {
    SCHEDULED: 'Scheduled',
    ONGOING: 'Ongoing',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
} as const;

export const NOTIFICATION_TYPES = {
    ASSIGNMENT_CREATED: 'Assignment Created',
    ASSIGNMENT_GRADED: 'Assignment Graded',
    LIVE_CLASS_SCHEDULED: 'Live Class Scheduled',
    COURSE_ENROLLED: 'Course Enrolled',
    NEW_LECTURE_ADDED: 'New Lecture Added',
} as const;

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    COURSES: '/courses',
    MY_COURSES: '/my-courses',
    ASSIGNMENTS: '/assignments',
    LIVE_CLASSES: '/live-classes',
    ATTENDANCE: '/attendance',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    USERS: '/users',
    INSTITUTES: '/institutes',
} as const;