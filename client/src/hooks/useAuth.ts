import { useAuthStore } from "../store/authStore"
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService";
import toast from 'react-hot-toast';


export const useAuth = () => {
    const { user, setUser, setTokens, logout: logoutStore } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const loginMutation = useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            authService.login(email, password),
        onSuccess: (data: any) => {
            setUser(data.user);
            setTokens(data.accessToken, data.refreshToken);
            toast.success('Login successful!');
            navigate('/dashboard');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Login failed');
        },
    });

    const registerMutation = useMutation({
        mutationFn: authService.register,
        onSuccess: (data: any) => {
            setUser(data.user);
            setTokens(data.accessToken, data.refreshToken);
            toast.success('Registration successful!');
            navigate('/dashboard');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Registration failed');
        },
    });

    const logoutMutation = useMutation({
        mutationFn: authService.logout,
        onSuccess: () => {
            logoutStore();
            queryClient.clear();
            toast.success('Logged out successfully');
            navigate('/login');
        },
    });

    const { data: currentUser } = useQuery({
        queryKey: ['me'],
        queryFn: authService.getMe,
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    return {
        user: currentUser || user,
        login: loginMutation.mutate,
        register: registerMutation.mutate,
        logout: logoutMutation.mutate,
        isLoading: loginMutation.isPending || registerMutation.isPending,
    };
}