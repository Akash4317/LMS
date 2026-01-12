import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { courseService } from "../services/courseService";
import { Spinner } from "../components/common/Spinner";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { BookOpen, CheckCircle, Clock, Play } from "lucide-react";

export const MyCourses: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

    const { data: courses, isLoading } = useQuery({
        queryKey: ['my-courses'],
        queryFn: courseService.getMyCourses,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    const filteredCourses = courses?.filter((course: any) => {
        if (filter === 'in-progress') return course.progress > 0 && course.progress < 100;
        if (filter === 'completed') return course.progress === 100;
        return true;
    }) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
                    <p className="text-gray-600 mt-2">Continue your learning journey</p>
                </div>
                <Button onClick={() => navigate('/courses')}>
                    Browse More Courses
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Enrolled</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{courses?.length || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">In Progress</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {courses?.filter((c: any) => c.progress > 0 && c.progress < 100).length || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Play className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {courses?.filter((c: any) => c.progress === 100).length || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                {[
                    { key: 'all', label: 'All Courses' },
                    { key: 'in-progress', label: 'In Progress' },
                    { key: 'completed', label: 'Completed' }
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
                    </button>
                ))}
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course: any) => (
                    <Card key={course._id} className="cursor-pointer hover:shadow-xl transition-shadow">
                        <img
                            src={course.thumbnail || 'https://via.placeholder.com/400x200'}
                            alt={course.title}
                            className="w-full h-40 object-cover rounded-lg mb-4"
                        />

                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                {course.title}
                            </h3>

                            {/* Progress Bar */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Progress</span>
                                    <span className="font-medium text-primary-600">{course.progress || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-primary-600 h-2 rounded-full transition-all"
                                        style={{ width: `${course.progress || 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t">
                                <div className="flex items-center text-gray-600 text-sm">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span>Last accessed: {course.lastAccessed ? new Date(course.lastAccessed).toLocaleDateString() : 'Never'}</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => navigate(`/courses/${course._id}/learn`)}
                                className="w-full"
                            >
                                {course.progress > 0 ? 'Continue Learning' : 'Start Course'}
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredCourses.length === 0 && (
                <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-4">
                        {filter === 'all'
                            ? 'You haven\'t enrolled in any courses yet'
                            : `No ${filter === 'in-progress' ? 'in progress' : 'completed'} courses`}
                    </p>
                    <Button onClick={() => navigate('/courses')}>
                        Browse Courses
                    </Button>
                </div>
            )}
        </div>
    );
}