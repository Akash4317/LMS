import api from "./api"

export const courseService = {

    getAllCourse: async (params) => {
        const response = await api.get('/courses', { params });
        return response.data;
    },

    getCourseById: async (courseId) => {
        const response = await api.get(`/courses/${courseId}`);
        return response.data.data;
    },

    getMyCourses: async () => {
        const response = await api.get('/courses/my-courses');
        return response.data.data;
    },

    createCourse: async (data) => {
        const response = await api.post('/courses', data);
        return response.data.data;
    },

    updateCourse: async (id, data) => {
        const response = await api.put(`/courses/${id}`, data);
        return response.data.data;
    },

    deleteCourse: async (id) => {
        await api.delete(`/courses/${id}`);
    },

    enrollInCourse: async (id) => {
        const response = await api.post(`/courses/${id}/enroll`);
        return response.data.data;
    },

    unenrollFromCourse: async (id) => {
        await api.delete(`/courses/${id}/enroll`);
    },

    uploadThumbnail: async (id, file) => {
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