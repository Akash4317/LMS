import { useQuery } from "@tanstack/react-query";
import { Spinner } from "../components/common/Spinner";
import api from "../services/api";
import { useState } from "react";
import { Badge } from "../components/common/Badge";
import { Calendar, Clock, ExternalLink, Users, Video } from "lucide-react";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { formatDateTime } from "../lib/utility";
import type { LiveClass } from "../types";

export const LiveClasses: React.FC = () => {
    const [filter, setFilter] = useState<'upcoming' | 'completed'>('upcoming');

    const { data, isLoading } = useQuery<LiveClass[]>({
        queryKey: ['live-classes', filter],
        queryFn: async () => {
            const response = await api.get(`/live-classes?status=${filter === 'upcoming' ? 'SCHEDULED' : 'COMPLETED'}`);
            return response.data.data as LiveClass[];
        },
    });

    const handleJoinClass = async (classId: string, meetingLink: string) => {
        try {
            await api.post(`/live-classes/${classId}/join`);
            window.open(meetingLink, '_blank');
        } catch (error) {
            console.error('Failed to join class:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    const classes = data || [];

    const getStatusBadge = (scheduledAt: string, status: string) => {
        const now = new Date();
        const classTime = new Date(scheduledAt);
        const diff = classTime.getTime() - now.getTime();
        const minutesUntil = Math.floor(diff / 60000);

        if (status === 'COMPLETED') return <Badge variant="info">Completed</Badge>;
        if (status === 'CANCELLED') return <Badge variant="danger">Cancelled</Badge>;
        if (status === 'ONGOING') return <Badge variant="success">Live Now</Badge>;
        if (minutesUntil <= 10 && minutesUntil > 0) return <Badge variant="warning">Starting Soon</Badge>;
        return <Badge variant="primary">Scheduled</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Live Classes</h1>
                    <p className="text-gray-600 mt-2">Join interactive sessions with instructors</p>
                </div>
                <Button>Schedule New Class</Button>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                {[
                    { key: 'upcoming', label: 'Upcoming Classes' },
                    { key: 'completed', label: 'Past Classes' }
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

            {/* Classes List */}
            <div className="space-y-4">
                {classes.map((liveClass: any) => (
                    <Card key={liveClass._id}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <Video className="w-5 h-5 text-primary-600" />
                                    <h3 className="text-xl font-semibold text-gray-900">{liveClass.title}</h3>
                                    {getStatusBadge(liveClass.scheduledAt, liveClass.status)}
                                </div>

                                {liveClass.description && (
                                    <p className="text-gray-600 mb-4">{liveClass.description}</p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center text-gray-600">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <span>{formatDateTime(liveClass.scheduledAt)}</span>
                                    </div>

                                    <div className="flex items-center text-gray-600">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span>{liveClass.duration} minutes</span>
                                    </div>

                                    <div className="flex items-center text-gray-600">
                                        <Users className="w-4 h-4 mr-2" />
                                        <span>{liveClass.type === 'ONE_ON_ONE' ? '1-on-1' : 'Batch Session'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-4">
                                    <img
                                        src={liveClass.host?.avatar || 'https://via.placeholder.com/40'}
                                        alt={liveClass.host?.name}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{liveClass.host?.name}</p>
                                        <p className="text-xs text-gray-500">Instructor</p>
                                    </div>
                                </div>
                            </div>

                            <div className="ml-4">
                                {liveClass.status === 'SCHEDULED' || liveClass.status === 'ONGOING' ? (
                                    <Button
                                        onClick={() => handleJoinClass(liveClass._id, liveClass.meetingLink)}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Join Class
                                    </Button>
                                ) : liveClass.recordingUrl ? (
                                    <Button variant="secondary">
                                        Watch Recording
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {classes.length === 0 && (
                <div className="text-center py-12">
                    <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                        No {filter} classes found
                    </p>
                </div>
            )}
        </div>
    );
}