import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import socketService from "../services/socketService";

export const useSocket = () => {
    const { accessToken, isAuthenticated } = useAuthStore();
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        if (isAuthenticated && accessToken) {
            socketService.connect(accessToken);

            // Listen for notifications
            socketService.on('notification', (notification:any) => {
                addNotification(notification);
            });

            return () => {
                socketService.disconnect();
            };
        }
    },[isAuthenticated, accessToken, addNotification]);
}