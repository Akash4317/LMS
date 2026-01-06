import { Readable } from 'stream';
import logger from '../utils/logger.js';

class uploadService {
    // uploadImage
    async uploadImage(file, folder = 'lms/images') {
        try {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        resource_type: 'image',
                        transformation: [
                            { width: 1920, height: 1080, crop: 'limit' },
                            { quality: 'auto' },
                            { fetch_format: 'auto' },
                        ],
                    },
                    (error, result) => {
                        if (error) {
                            logger.error('Image upload failed:', error);
                            reject(error)
                        } else if (result) {
                            resolve({
                                url: result.secure_url,
                                publicId: result.public_id,
                                format: result.format,
                                size: result.bytes,
                            });
                        }
                    }
                )
                Readable.from(file.buffer).pipe(uploadStream);
            })
        } catch (error) {
            logger.error('Upload service error:', error);
            throw error;
        }
    }

    // upload videos
    async uploadVideo(file, folder = 'lms/videos') {
        try {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        resource_type: 'video',
                        chunk_size: 6000000, // 6MB chunks
                        eager: [
                            { width: 1920, height: 1080, crop: 'limit', quality: 'auto', format: 'mp4' },
                            { width: 1280, height: 720, crop: 'limit', quality: 'auto', format: 'mp4' },
                            { width: 854, height: 480, crop: 'limit', quality: 'auto', format: 'mp4' },
                        ],
                        eager_async: true,
                    },
                    (error, result) => {
                        if (error) {
                            logger.error('Video upload failed:', error);
                            reject(error);
                        } else if (result) {
                            resolve({
                                url: result.secure_url,
                                publicId: result.public_id,
                                format: result.format,
                                size: result.bytes,
                                duration: result.duration,
                            });
                        }
                    }
                )

                Readable.from(file.buffer).pipe(uploadStream);
            })
        } catch (error) {
            logger.error('Video upload service error:', error);
            throw error;
        }
    }

    // Upload document
    async uploadDocument(file, folder = 'lms/documents') {
        try {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        resource_type: 'raw',
                    },
                    (error, result) => {
                        if (error) {
                            logger.error('Document upload failed:', error);
                            reject(error);
                        } else if (result) {
                            resolve({
                                url: result.secure_url,
                                publicId: result.public_id,
                                format: result.format,
                                size: result.bytes,
                            });
                        }
                    }
                );

                Readable.from(file.buffer).pipe(uploadStream);
            });
        } catch (error) {
            logger.error('Document upload service error:', error);
            throw error;
        }
    }

    // Delete file
    async deleteFile(publicId, resourceType = 'image') {
        try {
            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType,
            });
            return result.result === 'ok';
        } catch (error) {
            logger.error('File deletion failed:', error);
            return false;
        }
    }

    // Get video info
    async getVideoInfo(publicId) {
        try {
            const result = await cloudinary.api.resource(publicId, {
                resource_type: 'video',
            });
            return result;
        } catch (error) {
            logger.error('Get video info failed:', error);
            throw error;
        }
    }
}

export default new uploadService;