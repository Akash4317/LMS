import { BookOpen, FileText, TrendingUp, Users } from "lucide-react";
import { useAuthStore } from "../store/authStore"
import { Card } from "../components/common/Card";

export const Dashboard = () => {
    const { user } = useAuthStore();

    const stats = [
        { icon: BookOpen, label: 'Total Courses', value: '12', color: 'bg-blue-500' },
        { icon: Users, label: 'Total Students', value: '245', color: 'bg-green-500' },
        { icon: FileText, label: 'Assignments', value: '18', color: 'bg-yellow-500' },
        { icon: TrendingUp, label: 'Completion Rate', value: '87%', color: 'bg-purple-500' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-gray-600 mt-2">Here's what's happening with your courses today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`${stat.color} p-3 rounded-lg`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Recent Activity */}
            <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start space-x-3 pb-4 border-b last:border-b-0">
                            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">New assignment posted</p>
                                <p className="text-xs text-gray-500 mt-1">Introduction to React - Due in 3 days</p>
                            </div>
                            <span className="text-xs text-gray-500">2h ago</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}