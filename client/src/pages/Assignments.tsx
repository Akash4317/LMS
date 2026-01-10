import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import api from "../services/api";
import { Spinner } from "../components/common/Spinner";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Calendar, CheckCircle, Clock, FileText } from "lucide-react";
import { formatDate } from "../lib/utility";

export const Assignments: React.FC = () => {
    const [filter, setFilter] = useState('all');

    const { data, isLoading } = useQuery<any[]>({
        queryKey: ['assignments', filter],
        queryFn: async (): Promise<any[]> => {
            const response = await api.get('/assignments');
            return response.data.data as any[];
        },
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    const assignments = data || [];

    const getStatusBadge = (assignment: any) => {
        if (assignment.isSubmitted) {
            return assignment.mySubmission?.status === 'GRADED' ? (
                <Badge variant="success">Graded</Badge>
            ) : (
                <Badge variant="warning">Submitted</Badge>
            );
        }
        return <Badge variant="danger">Not Submitted</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
                    <p className="text-gray-600 mt-2">Complete and submit your assignments</p>
                </div>
                <Button>Create Assignment</Button>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                {['all', 'pending', 'submitted', 'graded'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Assignment List */}
            <div className="space-y-4">
                {assignments.map((assignment: any) => (
                    <Card key={assignment._id}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="w-5 h-5 text-primary-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                                    {getStatusBadge(assignment)}
                                </div>

                                <p className="text-gray-600 mb-4">{assignment.description}</p>

                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <span>Due: {formatDate(assignment.dueDate)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span>Max Marks: {assignment.maxMarks}</span>
                                    </div>
                                    {assignment.mySubmission?.marks !== undefined && (
                                        <div className="flex items-center text-green-600 font-medium">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            <span>
                                                Marks: {assignment.mySubmission.marks}/{assignment.maxMarks}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant={assignment.isSubmitted ? 'secondary' : 'primary'}
                                size="sm"
                            >
                                {assignment.isSubmitted ? 'View Submission' : 'Submit'}
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {assignments.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No assignments found</p>
                </div>
            )}
        </div>
    );
}