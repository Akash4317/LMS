import { Server as SocketServer } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import notificationService from '../services/notificationService.js';

export const initializeSocket = (httpServer) => {
    const io = new SocketServer(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Set socket server in notification service
    notificationService.setSocketServer(io);

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication token missing'));
            }

            const decoded = verifyAccessToken(token);
            const user = await user.findById(decoded.userId);

            if (!user || !user.isActive) {
                return next(new Error('Invalid or inactive user'));
            }

            socket.data.user = user;
            next();
        } catch (error) {
            logger.error('Socket authentication error:', error);
            next(new Error('Authentication failed'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        const user = socket.data.user;
        logger.info(`User connected: ${user.email} (${socket.id})`);

        // Join user's personal room
        socket.join(user._id.toString());

        // Join course rooms if student or teacher
        if (user.role === 'STUDENT' || user.role === 'ADMIN') {
            // This would be populated based on enrolled/teaching courses
            // For now, we'll handle it per event
        }

        // Handle typing in discussions/chat
        socket.on('typing', (data) => {
            socket.to(data.roomId).emit('user-typing', {
                userId: user._id,
                userName: user.name,
            });
        });

        socket.on('stop-typing', (data) => {
            socket.to(data.roomId).emit('user-stop-typing', {
                userId: user._id,
            });
        });

        // Handle live class events
        socket.on('join-live-class', (data) => {
            socket.join(`live-class-${data.classId}`);
            socket.to(`live-class-${data.classId}`).emit('user-joined-class', {
                userId: user._id,
                userName: user.name,
                avatar: user.avatar,
            });

            logger.info(`${user.email} joined live class ${data.classId}`);
        });

        socket.on('leave-live-class', (data) => {
            socket.leave(`live-class-${data.classId}`);
            socket.to(`live-class-${data.classId}`).emit('user-left-class', {
                userId: user._id,
                userName: user.name,
            });

            logger.info(`${user.email} left live class ${data.classId}`);
        });

        // Handle real-time quiz/poll (if implemented)
        socket.on('submit-poll-answer', (data) => {
            socket.to(`course-${data.courseId}`).emit('poll-answer-received', {
                userId: user._id,
                answer: data.answer,
            });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            logger.info(`User disconnected: ${user.email} (${socket.id})`);
        });

        // Error handling
        socket.on('error', (error) => {
            logger.error('Socket error:', error);
        });
    });

    logger.info('Socket.IO initialized successfully');
    return io;
};