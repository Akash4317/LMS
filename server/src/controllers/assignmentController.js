import Assignment, { AssignmentStatus } from '../models/assignment';
import Course from '../models/course';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import uploadService from '../services/uploadService';
import notificationService from '../services/notificationService';
import { NotificationType } from '../models/notification';
import emailService from '../services/emailService';

// Get all assignments for a course
export const getCourseAssignments = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { status } = req.query;

    const query = { courseId };
    if (status) query.status = status;

    const assignments = await Assignment.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

    // For students, include their submission status
    const assignmentsWithStatus = assignments.map(assignment => {
        const submission = assignment.submissions.find(
            sub => sub.studentId.toString() === req.user._id.toString()
        );

        return {
            ...assignment.toObject(),
            mySubmission: submission || null,
            isSubmitted: !!submission,
        };
    });

    res.json({
        success: true,
        data: assignmentsWithStatus,
    });
})

// Get single assignment
export const getAssignmentById = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id)
        .populate('courseId', 'title students teachers')
        .populate('createdBy', 'name email avatar')
        .populate('submissions.studentId', 'name email avatar')
        .populate('submissions.gradedBy', 'name email');

    if (!assignment) {
        throw new AppError('Assignment not found', 404);
    }

    // Check access
    const course = await Course.findById(assignment.courseId);
    const isEnrolled = course?.students.some(
        id => id.toString() === req.user._id.toString()
    );
    const isTeacher = course?.teachers.some(
        id => id.toString() === req.user._id.toString()
    );

    if (!isEnrolled && !isTeacher) {
        throw new AppError('You do not have access to this assignment', 403);
    }

    res.json({
        success: true,
        data: assignment,
    });

})

// Create assignment
export const createAssignment = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        instructions,
        dueDate,
        maxMarks,
        passingMarks,
        allowLateSubmission,
        latePenalty,
        maxFileSize,
        allowedFileTypes,
        syllabusId,
    } = req.body

    const course = await Assignment.findById(req.params.courseId);

    if (!course) {
        throw new AppError('course not found', 404);
    }

    const assignment = await Assignment.create({
        courseId: req.params.courseId,
        title,
        description,
        instructions,
        dueDate,
        maxMarks,
        passingMarks,
        allowLateSubmission,
        latePenalty,
        maxFileSize,
        allowedFileTypes,
        syllabusId,
        createdBy: req.user._id,
        status: AssignmentStatus.DRAFT,
    });

    await assignment.populate('createdBy', 'name email');

    res.status(201).json({
        success: true,
        message: 'Assignment created successfully',
        data: assignment,
    });
})

//  Update assignment
export const updateAssignment = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
        throw new AppError('Assignment not found', 404);
    }

    const allowedUpdates = [
        'title',
        'description',
        'instructions',
        'dueDate',
        'maxMarks',
        'passingMarks',
        'allowLateSubmission',
        'latePenalty',
        'maxFileSize',
        'allowedFileTypes',
        'status',
    ];

    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            (assignment)[field] = req.body[field];
        }
    });

    await assignment.save();

    res.json({
        success: true,
        message: 'Assignment updated successfully',
        data: assignment,
    })
})

// publish assingment 
export const publishAssignment = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id)
        .populate('courseId', 'title students');

    if (!assignment) {
        throw new AppError('Assignment not found', 404);
    }

    assignment.status = AssignmentStatus.PUBLISHED;
    await assignment.save();

    // Notify all students
    const course = await Course.findById(assignment.courseId);
    if (course && course.students.length > 0) {
        await notificationService.createBulkNotifications(
            course.students,
            NotificationType.ASSIGNMENT_CREATED,
            'New Assignment Posted',
            `A new assignment "${assignment.title}" has been posted in ${course.title}`,
            { courseId: course._id, assignmentId: assignment._id },
            'HIGH'
        );

        // Send emails
        for (const studentId of course.students) {
            const student = await User.findById(studentId);
            if (student) {
                emailService.sendAssignmentNotification(
                    student.email,
                    student.name,
                    course.title,
                    assignment.title,
                    assignment.dueDate
                );
            }
        }
    }

    res.json({
        success: true,
        message: 'Assignment updated successfully',
        data: assignment
    })
})

// Delete assignment
export const deleteAssignment = asyncHandler(async (req, res) => {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
        throw new AppError('Assignment not found', 404);
    }

    await assignment.deleteOne();

    res.json({
        success: true,
        message: 'Assignment deleted successfully',
    });
})

// Submit assignment
export const submitAssignment = asyncHandler(async (req, res) => {
    const { textContent } = req.body;

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
        throw new AppError('Assignment not found', 404);
    }

    if (assignment.status !== AssignmentStatus.PUBLISHED) {
        throw new AppError('Assignment is not open for submissions', 400);
    }

    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
        sub => sub.studentId.toString() === req.user._id.toString()
    );

    if (existingSubmission && existingSubmission.status === 'GRADED') {
        throw new AppError('Assignment already graded. Contact teacher to resubmit.', 400);
    }

    // Check deadline
    const now = new Date();
    const isLate = now > assignment.dueDate;

    if (isLate && !assignment.allowLateSubmission) {
        throw new AppError('Submission deadline has passed', 400);
    }

    // Handle file uploads
    const files = [];
    if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
            const result = await uploadService.uploadDocument(file, 'lms/assignments');
            files.push({
                fileName: file.originalname,
                fileUrl: result.url,
                fileSize: result.size,
                fileType: result.format,
            });
        }
    }

    // Create or update submission
    if (existingSubmission) {
        existingSubmission.files = files;
        existingSubmission.textContent = textContent;
        existingSubmission.submittedAt = new Date();
        existingSubmission.status = 'PENDING';
    } else {
        assignment.submissions.push({
            studentId: req.user._id,
            submittedAt: new Date(),
            files,
            textContent,
            maxMarks: assignment.maxMarks,
            status: 'PENDING',
        });
    }

    await assignment.save();

    // Notify teacher
    const course = await Course.findById(assignment.courseId);
    if (course) {
        await notificationService.createBulkNotifications(
            course.teachers,
            NotificationType.STUDENT_SUBMITTED_ASSIGNMENT,
            'Assignment Submitted',
            `${req.user.name} submitted assignment "${assignment.title}"`,
            { courseId: course._id, assignmentId: assignment._id },
            'MEDIUM'
        );
    }

    res.json({
        success: true,
        message: 'Assignment submitted successfully',
        data: assignment,
    });

})

// Grade assignment
export const gradeAssignment = asyncHandler(async (req, res) => {
    const { marks, feedback } = req.body;
    const { submissionId } = req.params;

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
        throw new AppError('Assignment not found', 404);
    }

    const submission = assignment.submissions.id(submissionId);

    if (!submission) {
        throw new AppError('Submission not found', 404);
    }

    if (marks < 0 || marks > assignment.maxMarks) {
        throw new AppError(`Marks must be between 0 and ${assignment.maxMarks}`, 400);
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
    submission.status = 'GRADED';

    await assignment.save();

    // Notify student
    const student = await User.findById(submission.studentId);
    if (student) {
        await notificationService.createNotification(
            student._id,
            NotificationType.ASSIGNMENT_GRADED,
            'Assignment Graded',
            `Your assignment "${assignment.title}" has been graded`,
            {
                courseId: assignment.courseId,
                assignmentId: assignment._id,
                marks,
                maxMarks: assignment.maxMarks,
            },
            'HIGH',
            `/assignments/${assignment._id}`
        );

        // Send email
        emailService.sendGradeNotification(
            student.email,
            student.name,
            assignment.title,
            marks,
            assignment.maxMarks,
            feedback
        );
    }

    res.json({
        success: true,
        message: 'Assignment graded successfully',
        data: assignment,
    });
})