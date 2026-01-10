import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    FileText,
    Video,
    Calendar,
    Users,
    Settings,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utility';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT', 'PARENT'] },
    { icon: BookOpen, label: 'Courses', path: '/courses', roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT'] },
    { icon: GraduationCap, label: 'My Courses', path: '/my-courses', roles: ['STUDENT'] },
    { icon: FileText, label: 'Assignments', path: '/assignments', roles: ['ADMIN', 'STUDENT'] },
    { icon: Video, label: 'Live Classes', path: '/live-classes', roles: ['ADMIN', 'STUDENT'] },
    { icon: Calendar, label: 'Attendance', path: '/attendance', roles: ['ADMIN', 'STUDENT', 'PARENT'] },
    { icon: Users, label: 'Users', path: '/users', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT', 'PARENT'] },
];

export const Sidebar: React.FC = () => {
    const { user } = useAuthStore();
    const { sidebarOpen } = useUIStore();
    const location = useLocation();

    const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

    if (!sidebarOpen) return null;

    return (
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg z-30 overflow-y-auto">
            <nav className="p-4 space-y-2">
                {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-primary-50 text-primary-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}