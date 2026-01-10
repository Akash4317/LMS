import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { courseService } from "../services/courseService";
import toast from "react-hot-toast";
import { Spinner } from "../components/common/Spinner";
import { Badge } from "../components/common/Badge";
import { Award, BookOpen, Clock, Users } from "lucide-react";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";

export const CourseDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: course, isLoading } = useQuery({
        queryKey: ['course', id],
        queryFn: () => courseService.getCourseById(id!),
        enabled: !!id,
    });

    const enrollMutation = useMutation({
        mutationFn: () => courseService.enrollInCourse(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', id] });
            toast.success('Enrolled successfully!');
            navigate('/my-courses');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Enrollment failed');
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!course) {
        return <div>Course not found</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <Badge variant={course.level === 'BEGINNER' ? 'success' : 'primary'}>
                            {course.level}
                        </Badge>
                        <h1 className="text-3xl font-bold text-gray-900 mt-3">{course.title}</h1>
                        <p className="text-gray-600 mt-2">{course.description}</p>

                        <div className="flex items-center gap-6 mt-6">
                            <div className="flex items-center text-gray-600">
                                <Users className="w-5 h-5 mr-2" />
                                <span>{course.enrollmentCount || 0} students</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Clock className="w-5 h-5 mr-2" />
                                <span>{course.duration || 0} hours</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <BookOpen className="w-5 h-5 mr-2" />
                                <span>{course.category}</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            {course.isEnrolled ? (
                                <Button onClick={() => navigate(`/courses/${id}/learn`)}>
                                    Continue Learning
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => enrollMutation.mutate()}
                                    isLoading={enrollMutation.isPending}
                                >
                                    Enroll Now
                                </Button>
                            )}
                        </div>
                    </div>

                    <div>
                        <img
                            src={course.thumbnail || 'https://via.placeholder.com/400x300'}
                            alt={course.title}
                            className="w-full h-64 object-cover rounded-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Course Content */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Card>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Course Content</h2>
                        <div className="space-y-3">
                            {/* Syllabus content would go here */}
                            <p className="text-gray-600">Loading course content...</p>
                        </div>
                    </Card>
                </div>

                <div>
                    <Card>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Instructors</h3>
                        <div className="space-y-3">
                            {course.teachers?.map((teacher: any) => (
                                <div key={teacher._id} className="flex items-center space-x-3">
                                    <img
                                        src={teacher.avatar || 'https://via.placeholder.com/40'}
                                        alt={teacher.name}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">{teacher.name}</p>
                                        <p className="text-xs text-gray-500">{teacher.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="mt-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">What you'll learn</h3>
                        <ul className="space-y-2">
                            {['Fundamentals', 'Advanced concepts', 'Practical projects', 'Best practices'].map(
                                (item, index) => (
                                    <li key={index} className="flex items-start">
                                        <Award className="w-5 h-5 text-primary-600 mr-2 mt-0.5" />
                                        <span className="text-gray-700">{item}</span>
                                    </li>
                                )
                            )}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}