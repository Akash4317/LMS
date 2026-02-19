import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authService } from "../services/authService";
import toast from "react-hot-toast";
import { CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "../components/common/Button";

export const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<any>({});

    const resetPasswordMutation = useMutation({
        mutationFn: ({ token, password }: { token: string; password: string }) =>
            authService.resetPassword(token, password),
        onSuccess: () => {
            toast.success('Password reset successful!');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        },
    });

    const validatePassword = (password: string) => {
        const errors: any = {};

        if (password.length < 8) {
            errors.length = 'Password must be at least 8 characters';
        }
        if (!/[A-Z]/.test(password)) {
            errors.uppercase = 'Must contain at least one uppercase letter';
        }
        if (!/[a-z]/.test(password)) {
            errors.lowercase = 'Must contain at least one lowercase letter';
        }
        if (!/[0-9]/.test(password)) {
            errors.number = 'Must contain at least one number';
        }
        if (!/[!@#$%^&*]/.test(password)) {
            errors.special = 'Must contain at least one special character (!@#$%^&*)';
        }

        return errors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: any = {};

        // Validate passwords
        const passwordErrors = validatePassword(formData.newPassword);
        if (Object.keys(passwordErrors).length > 0) {
            newErrors.newPassword = 'Password does not meet requirements';
        }

        if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!token) {
            toast.error('Invalid reset token');
            return;
        }

        resetPasswordMutation.mutate({
            token,
            password: formData.newPassword,
        });
    };

    const handlePasswordChange = (value: string) => {
        setFormData({ ...formData, newPassword: value });
        setErrors({ ...errors, newPassword: '' });
    };

    const passwordValidation = validatePassword(formData.newPassword);
    const hasPasswordErrors = Object.keys(passwordValidation).length > 0;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
                        <p className="text-gray-600 mt-2">
                            Create a strong, secure password for your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.newPassword}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Enter new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                            )}
                        </div>

                        {/* Password Requirements */}
                        {formData.newPassword && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">
                                    Password Requirements:
                                </h4>
                                <div className="space-y-2">
                                    {[
                                        { key: 'length', text: 'At least 8 characters' },
                                        { key: 'uppercase', text: 'One uppercase letter' },
                                        { key: 'lowercase', text: 'One lowercase letter' },
                                        { key: 'number', text: 'One number' },
                                        { key: 'special', text: 'One special character (!@#$%^&*)' },
                                    ].map((requirement) => {
                                        const isValid = !passwordValidation[requirement.key];
                                        return (
                                            <div key={requirement.key} className="flex items-center text-sm">
                                                {isValid ? (
                                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                                ) : (
                                                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2" />
                                                )}
                                                <span className={isValid ? 'text-green-700' : 'text-gray-600'}>
                                                    {requirement.text}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => {
                                        setFormData({ ...formData, confirmPassword: e.target.value });
                                        setErrors({ ...errors, confirmPassword: '' });
                                    }}
                                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Confirm new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={resetPasswordMutation.isPending}
                            disabled={hasPasswordErrors || formData.newPassword !== formData.confirmPassword}
                        >
                            Reset Password
                        </Button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};