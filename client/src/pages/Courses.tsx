import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom"
import { courseService } from "../services/courseService";
import { Spinner } from "../components/common/Spinner";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";

export const Courses: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['courses', search, selectedLevel],
        queryFn: () => courseService.getAllCourses({ search, level: selectedLevel }),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    const courses = data?.data || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">All Courses</h1>
                    <p className="text-gray-600 mt-2">Browse and enroll in available courses</p>
                </div>
                <Button>Create Course</Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full"
                    />
                </div>
                <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Levels</option>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                </select>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               
                {courses.map((course: any) => (
                    <Card
                        key={course._id}
                        className="cursor-pointer hover:shadow-xl transition-shadow"
                        onClick={() => navigate(`/courses/${course._id}`)}
                    >
                        <img
                            src={course.thumbnail || 'https://via.placeholder.com/400x200'}
                            alt={course.title}
                            className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Badge variant={course.level === 'BEGINNER' ? 'success' : 'primary'}>
                                    {course.level}
                                </Badge>
                                <span className="text-sm text-gray-500">{course.category}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                {course.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                            <div className="flex items-center justify-between pt-3 border-t">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">
                                        {course.enrollmentCount || 0} students
                                    </span>
                                </div>
                                {course.price > 0 ? (
                                    <span className="text-lg font-bold text-primary-600">${course.price}</span>
                                ) : (
                                    <Badge variant="success">Free</Badge>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {courses.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No courses found</p>
                </div>
            )}
        </div>
    );
};