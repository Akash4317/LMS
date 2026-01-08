export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'STUDENT' | 'PARENT';
    avatar?: string;
    phone?: string;
    address?: string;
    instituteId?: string;
    linkedStudents?: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Institute {
    _id: string;
    name: string;
    logo?: string;
    description?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
    };
    contactEmail: string;
    contactPhone: string;
    website?: string;
    createdAt: string;
}

export interface Course {
    _id: string;
    title: string;
    description: string;
    thumbnail?: string;
    instituteId: Institute;
    teachers: User[];
    category?: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    duration: number; // in hours
    price?: number;
    isPublished: boolean;
    isFeatured: boolean;
    enrollmentCount?: number;
    tags: string[];
    createdAt: string;
    isEnrolled?: boolean;
    progress?: number;
}

export interface Lecture {
    _id: string;
    title: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number;
    courseId: string;
    order: number;
    isPublished: boolean;
    isFree: boolean;
    views: number;
    createdAt: string;
}

export interface Assignment {
    _id: string;
    courseId: string;
    title: string;
    description: string;
    dueDate: string;
    maxMarks: number;
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
    submissions: Submission[];
    mySubmission?: Submission;
    isSubmitted?: boolean;
    createdAt: string;
}

export interface Submission {
    _id: string;
    studentId: string;
    submittedAt: string;
    files: {
        fileName: string;
        fileUrl: string;
    }[];
    marks?: number;
    maxMarks: number;
    feedback?: string;
    status: 'PENDING' | 'GRADED' | 'RESUBMIT';
}

export interface LiveClass {
    _id: string;
    courseId: string;
    title: string;
    description?: string;
    type: 'ONE_ON_ONE' | 'BATCH';
    scheduledAt: string;
    duration: number;
    meetingLink: string;
    host: User;
    status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
}

export interface Notification {
    _id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    createdAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}