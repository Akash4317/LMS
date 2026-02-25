import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { useNotificationStore } from "../store/notificationStore";
import api from "../services/api";
import toast from "react-hot-toast";
import { AlertCircle, Award, Bell, BellOff, BookOpen, Calendar, Check, CheckCheck, FileText, Trash2, Video } from "lucide-react";
import { Spinner } from "../components/common/Spinner";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { formatDateTime } from "../lib/utility";

export const Notifications = () => {
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const queryClient = useQueryClient();
    const socket = useSocket();
    const { addNotification, markAsRead: storeMarkAsRead, notifications: storeNotifications } = useNotificationStore();

    // Fetch notification

    const { data, isLoading } = useQuery({
        queryKey: ['notifications', filter],
        queryFn: async () => {
            const response = await api.get('/notifications');
            return response.data;
        },
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            await api.put(`/notifications/${notificationId}/read`);
        },
        onSuccess: (_, notificationId) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            storeMarkAsRead(notificationId);
            toast.success('Notification marked as read');
        },
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            await api.put('/notifications/read-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('All notifications marked as read');
        },
    });

    // Delete notification mutation
    const deleteNotificationMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            await api.delete(`/notifications/${notificationId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Notification deleted');
        },
    });

    const fetchPageData = useMutation({
        mutationFn: async (page: number) => {
            const response = await api.get(`/notifications?page=${page}`);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['notifications'], data);
        },
        onError: () => {
            toast.error('Failed to fetch notifications for the selected page');
        },
    });

    const handlePageChange = (newPage: number) => {
        fetchPageData.mutate(newPage);
    };
    

    // Listen for real-time notifications
    useEffect(() => {
        if (socket) {
            socket.on('notification', (notification: any) => {
                // Add to store
                addNotification(notification);

                // Show toast
                toast.custom((t) => (
                    <div
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'
                            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                    >
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {notification.title}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {notification.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex border-l border-gray-200">
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ), {
                    duration: 5000,
                    position: 'top-right',
                });

                // Refresh notifications list
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            });

            return () => {
                socket.off('notification');
            };
        }
    }, [socket, addNotification, queryClient]);
  
    const notifications = data?.data || [];
      // @ts-ignore
    const unreadCount = data?.unreadCount || 0;

    // Filter notifications
      // @ts-ignore
    const filteredNotifications = notifications.filter((notification: any) => {
        if (filter === 'unread' && notification.isRead) return false;
        if (filter === 'read' && !notification.isRead) return false;
        if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
        return true;
    });

    const getNotificationIcon = (type: string) => {
        const iconClass = "w-6 h-6";

        switch (type) {
            case 'ASSIGNMENT_CREATED':
            case 'ASSIGNMENT_GRADED':
            case 'ASSIGNMENT_DUE_SOON':
                return <FileText className={`${iconClass} text-blue-600`} />;
            case 'LIVE_CLASS_SCHEDULED':
            case 'LIVE_CLASS_REMINDER':
            case 'LIVE_CLASS_STARTED':
                return <Video className={`${iconClass} text-purple-600`} />;
            case 'COURSE_ENROLLED':
            case 'NEW_LECTURE_ADDED':
                return <BookOpen className={`${iconClass} text-green-600`} />;
            case 'COURSE_COMPLETED':
            case 'CERTIFICATE_GENERATED':
                return <Award className={`${iconClass} text-yellow-600`} />;
            case 'ATTENDANCE_MARKED':
                return <Calendar className={`${iconClass} text-indigo-600`} />;
            case 'ANNOUNCEMENT':
                return <AlertCircle className={`${iconClass} text-orange-600`} />;
            default:
                return <Bell className={`${iconClass} text-gray-600`} />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return 'danger';
            case 'HIGH':
                return 'warning';
            case 'MEDIUM':
                return 'primary';
            case 'LOW':
                return 'info';
            default:
                return 'primary';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Bell className="w-8 h-8 mr-3" />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="ml-3 px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-600 mt-2">Stay updated with your learning activities</p>
                </div>

                <Button
                    variant="secondary"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={unreadCount === 0}
                >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark All as Read
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-wrap gap-4">
                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'unread', label: 'Unread' },
                            { key: 'read', label: 'Read' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key as any)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === tab.key
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {tab.label}
                                {tab.key === 'unread' && unreadCount > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-white text-primary-600 rounded-full text-xs">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Type Filter */}
                    <div className="flex-1">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Types</option>
                            <option value="ASSIGNMENT_CREATED">Assignments</option>
                            <option value="LIVE_CLASS_SCHEDULED">Live Classes</option>
                            <option value="COURSE_ENROLLED">Courses</option>
                            <option value="ANNOUNCEMENT">Announcements</option>
                            <option value="ATTENDANCE_MARKED">Attendance</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Notifications List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <BellOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No notifications
                            </h3>
                            <p className="text-gray-600">
                                {filter === 'unread'
                                    ? "You're all caught up! No unread notifications."
                                    : "You don't have any notifications yet."}
                            </p>
                        </div>
                    </Card>
                ) : (
                    filteredNotifications.map((notification: any) => (
                        <Card
                            key={notification._id}
                            className={`transition-all hover:shadow-lg ${!notification.isRead ? 'border-l-4 border-l-primary-600 bg-primary-50/30' : ''
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex-shrink-0 mt-1">
                                    {getNotificationIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                                {notification.title}
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.message}
                                            </p>
                                        </div>

                                        <Badge variant={getPriorityColor(notification.priority) as any}>
                                            {notification.priority}
                                        </Badge>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-xs text-gray-500">
                                            {formatDateTime(notification.createdAt)}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            {notification.actionUrl && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => window.location.href = notification.actionUrl}
                                                >
                                                    View
                                                </Button>
                                            )}

                                            {!notification.isRead && (
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => markAsReadMutation.mutate(notification._id)}
                                                >
                                                    <Check className="w-4 h-4 mr-1" />
                                                    Mark Read
                                                </Button>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="primary"
                                                onClick={() => deleteNotificationMutation.mutate(notification._id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

           {/* Pagination */}
           
           {data?.pagination && data.pagination.pages > 1 && (
                <Card>
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing {filteredNotifications.length} of {data.pagination.total} notifications
                        </div>
                        <div className="flex gap-2">
                            <Button
                                disabled={data.pagination.currentPage === 1}
                                onClick={() => handlePageChange(data.pagination.currentPage - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                disabled={data.pagination.currentPage === data.pagination.pages}
                                onClick={() => handlePageChange(data.pagination.currentPage + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );

}