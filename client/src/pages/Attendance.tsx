import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "../services/api";
import { Spinner } from "../components/common/Spinner";
import { CalendarIcon, CheckCircle, TrendingUp, XCircle } from "lucide-react";
import { formatDate } from "../lib/utility";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import type { Course } from "../types";

export const Attendance: React.FC = () => {
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const { data: courses } = useQuery<Course[]>({
        queryKey: ['my-courses'],
        queryFn: async () => {
            const response = await api.get('/courses/my-courses');
            return response.data.data as Course[];
        },
    });

    const { data: attendanceData, isLoading } = useQuery({
        queryKey: ['attendance', selectedCourse, dateRange],
        queryFn: async () => {
            const params = new URLSearchParams({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                ...(selectedCourse !== 'all' && { courseId: selectedCourse })
            });
            const response = await api.get(`/attendance?${params}`);
            return response.data.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    const attendance :any = attendanceData || [];

    // Calculate statistics
    const totalClasses = attendance.length;
    const presentCount = attendance.filter((a: any) => a.status === 'PRESENT').length;
    const absentCount = attendance.filter((a: any) => a.status === 'ABSENT').length;
    const lateCount = attendance.filter((a: any) => a.status === 'LATE').length;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PRESENT': return 'success';
            case 'ABSENT': return 'danger';
            case 'LATE': return 'warning';
            case 'EXCUSED': return 'info';
            default: return 'primary';
        }
    };

    const getStatusIcon = (status: string) => {
        return status === 'PRESENT' ? (
            <CheckCircle className="w-4 h-4" />
        ) : (
            <XCircle className="w-4 h-4" />
        );
    };

    return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-600 mt-2">Track your class attendance and statistics</p>
          </div>
    
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Classes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalClasses}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
    
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{presentCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>
    
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{absentCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>
    
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-primary-600 mt-1">{attendancePercentage}%</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </Card>
          </div>
    
          {/* Filters */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Courses</option>
                  {courses?.map((course: any) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
    
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
    
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </Card>
    
          {/* Attendance Records */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Attendance Records</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendance.map((record: any) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {record.courseId?.title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusColor(record.status) as any}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(record.status)}
                            {record.status}
                          </div>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.remarks || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.markedBy?.name || 'Auto'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
    
            {attendance.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No attendance records found</p>
              </div>
            )}
          </Card>
        </div>
      );
}