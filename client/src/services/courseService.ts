import type { Course } from "../types";
import api from "./api"

export const courseService = {

    getAllCourses: async (params:any) => {
        const response = await api.get('/courses', { params });
        return response.data;
    },

    getCourseById: async (courseId: string): Promise<Course> => {
        const response = await api.get(`/courses/${courseId}`);
        return response.data.data as Course;
    },

    getMyCourses: async (): Promise<Course[]> => {
        const response = await api.get('/courses/my-courses');
        return response.data.data as Course[];
    },

    createCourse: async (data:any) => {
        const response = await api.post('/courses', data);
        return response.data.data;
    },

    updateCourse: async (id:any, data:any) => {
        const response = await api.put(`/courses/${id}`, data);
        return response.data.data;
    },

    deleteCourse: async (id:any) => {
        await api.delete(`/courses/${id}`);
    },

    enrollInCourse: async (id:any) => {
        const response = await api.post(`/courses/${id}/enroll`);
        return response.data.data;
    },

    unenrollFromCourse: async (id:any) => {
        await api.delete(`/courses/${id}/enroll`);
    },

    uploadThumbnail: async (id:any, file:any) => {
        const formData = new FormData();
        formData.append('thumbnail', file);

        const response = await api.post(`/courses/${id}/thumbnail`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    }
}