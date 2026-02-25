import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../store/notificationStore";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { Bell } from "lucide-react";
import { formatDateTime } from "../../lib/utility";

export const NotificationBell: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { unreadCount } = useNotificationStore();

    const { data } = useQuery({
        queryKey: ['recent-notifications'],
        queryFn: async () => {
            const response = await api.get('/notifications?limit=5');
            return response.data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const recentNotifications = data?.data || [];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getNotificationIcon = (type: string) => {
        // Use the same logic as main page
        switch (type) {
            case 'ASSIGNMENT_CREATED':
                return '📝';
            case 'LIVE_CLASS_SCHEDULED':
                return '🎥';
            case 'COURSE_ENROLLED':
                return '📚';
            case 'CERTIFICATE_GENERATED':
                return '🏆';
            default:
                return '🔔';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-primary-600 font-medium">
                                {unreadCount} unread
                            </span>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {recentNotifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            recentNotifications.map((notification: any) => (
                                <div
                                    key={notification._id}
                                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={() => {
                                        setIsOpen(false);
                                        if (notification.actionUrl) {
                                            navigate(notification.actionUrl);
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                {notification.title}
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatDateTime(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-gray-200">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/notifications');
                            }}
                            className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            View All Notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};