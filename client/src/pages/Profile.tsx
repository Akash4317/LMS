import type React from "react";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService";
import toast from "react-hot-toast";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { formatDate } from "../lib/utility";
import { Calendar, Camera, Mail, Phone } from "lucide-react";
import { Input } from "../components/common/Input";
import { Avatar } from "../components/common/Avatar";

export const Profile: React.FC = () => {
    const { user, setUser } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
    });

    const updateMutation = useMutation({
        mutationFn: authService.updateProfile,
        onSuccess: (data) => {
            setUser(data);
            setIsEditing(false);
            toast.success('Profile updated successfully');
        },
        onError: () => {
            toast.error('Failed to update profile');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600 mt-2">Manage your account settings</p>
            </div>

            {/* Profile Header */}
            <Card>
                <div className="flex items-center space-x-6">
                    <div className="relative">
                        <Avatar src={user?.avatar} name={user?.name || 'User'} size="lg" />
                        <button className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full text-white hover:bg-primary-700 transition-colors">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                        <p className="text-gray-600">{user?.email}</p>
                        <div className="flex items-center gap-4 mt-3">
                            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                                {user?.role}
                            </span>
                            <span className="text-sm text-gray-500">
                                Member since {formatDate(user?.createdAt || new Date())}
                            </span>
                        </div>
                    </div>

                    <Button
                        variant={isEditing ? 'secondary' : 'primary'}
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                </div>
            </Card>

            {/* Profile Information */}
            <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h3>

                {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />

                        <Input
                            label="Phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />

                        <div className="flex gap-3">
                            <Button type="submit" isLoading={updateMutation.isPending}>
                                Save Changes
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 text-gray-700">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{user?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 text-gray-700">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium">{user?.phone || 'Not provided'}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 text-gray-700">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Joined</p>
                                <p className="font-medium">{formatDate(user?.createdAt || new Date())}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Change Password */}
            <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Change Password</h3>
                <Button variant="secondary">Change Password</Button>
            </Card>
        </div>
    );
};