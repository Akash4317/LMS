import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { Link } from "react-router-dom";
import { Avatar } from "../common/Avatar";
import { NotificationBell } from "./NotificationBell";

export const Navbar: React.FC = () => {
    const { user } = useAuthStore();
    const { toggleSidebar } = useUIStore();
    const { logout } = useAuth();

    return (
        <nav className="bg-white shadow-md sticky top-0 z-40">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <Link to="/dashboard" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold">L</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">LMS Platform</span>
                        </Link>
                    </div>

                    {/* Right */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                       <NotificationBell />

                        {/* User Menu */}
                        <div className="flex items-center space-x-3">
                            <Avatar src={user?.avatar} name={user?.name || 'User'} />
                            <div className="hidden md:block">
                                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500">{user?.role}</p>
                            </div>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={() => logout()}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-red-600"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}