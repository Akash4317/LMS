import { useMutation } from "@tanstack/react-query";
import { useState } from "react"
import { authService } from "../services/authService";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";

export const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);

    const forgotPasswordMutation = useMutation({
        mutationFn: authService.forgotPassword,
        onSuccess: () => {
            setEmailSent(true);
            toast.success('Password reset link sent to your email!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send reset email');
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email');
            return;
        }
        forgotPasswordMutation.mutate(email);
    }

    if (emailSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-50 to-purple-50 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Check Your Email
                        </h1>
                        <p className="text-gray-600 mb-6">
                            We've sent a password reset link to <strong>{email}</strong>
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
                            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                                <li>Check your email inbox</li>
                                <li>Click the reset link (valid for 30 minutes)</li>
                                <li>Create your new password</li>
                            </ol>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Didn't receive the email?{' '}
                            <button
                                onClick={() => {
                                    setEmailSent(false);
                                    forgotPasswordMutation.mutate(email);
                                }}
                                className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Resend
                            </button>
                        </p>

                        <Link
                            to="/login"
                            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-50 to-purple-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
                        <p className="text-gray-600 mt-2">
                            No worries! Enter your email and we'll send you reset instructions.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={forgotPasswordMutation.isPending}
                        >
                            Send Reset Link
                        </Button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Need help? Contact our support team</p>
                    <a href="mailto:support@lms.com" className="text-primary-600 hover:text-primary-700">
                        support@lms.com
                    </a>
                </div>
            </div>
        </div>
    );
}
