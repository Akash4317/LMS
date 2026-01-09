import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { courseService } from '../services/courseService';


export const useCourses = (filters?: any) => {
    const queryClient = useQueryClient();
  
    const { data, isLoading, error } = useQuery({
      queryKey: ['courses', filters],
      queryFn: () => courseService.getAllCourses(filters),
    });
  
    const { data: myCourses } = useQuery({
      queryKey: ['my-courses'],
      queryFn: courseService.getMyCourses,
    });
  
    const enrollMutation = useMutation({
      mutationFn: courseService.enrollInCourse,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        queryClient.invalidateQueries({ queryKey: ['my-courses'] });
        toast.success('Enrolled successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Enrollment failed');
      },
    });
  
    return {
      courses: data?.data || [],
      myCourses: myCourses || [],
      isLoading,
      error,
      enroll: enrollMutation.mutate,
    };
  };