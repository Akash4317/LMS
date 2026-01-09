import api from "./api";

export const authService = {

    login: async (email:string, password:string) => {
        const response = await api.post('/auth/login', {
            email,
            password
        });
        return response.data.data;
    },

    register: async (data:any) => {
        const response = await api.post('/auth/register', data);
        return response.data.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data.data;
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data.data;
    },

    updateProfile: async (data:any) => {
        const response = await api.put('/auth/profile', data);
        return response.data.data;
    },

    changePassword: async (currentPassword:string, newPassword:string) => {
        await api.put('/auth/change-password', {
            currentPassword,
            newPassword,
        });
    },

    forgotPassword: async (email:string) => {
        await api.post('/auth/forgot-password', { email });
    },

    resetPassword: async (token:string, newPassword:string) => {
        await api.post(`/auth/reset-password/${token}`, {
            newPassword,
        });
    },
}