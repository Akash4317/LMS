import type React from "react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/common/Input";
import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { CheckCircle } from "lucide-react";

export const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [errors, setErrors] = useState<any>({});
    const { register, isLoading } = useAuth();

    const validate = () => {
        const newErrors: any = {};

        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        // Clear error when user starts typing
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const benefits = [
        'Access to 5,000+ courses',
        'Learn from expert instructors',
        'Interactive live classes',
        'Get certified upon completion',
        'Track your progress',
        'Learn at your own pace'
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold text-white">L</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
                        <p className="text-gray-600 mt-2">Start your learning journey today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Full Name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            error={errors.name}
                            required
                        />

                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            error={errors.email}
                            required
                        />

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            error={errors.password}
                            required
                        />

                        <Input
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="••••••••"
                            error={errors.confirmPassword}
                            required
                        />

                        <div className="flex items-start">
                            <input
                                type="checkbox"
                                className="mt-1 mr-2"
                                required
                            />
                            <label className="text-sm text-gray-600">
                                I agree to the{' '}
                                <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>

                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Create Account
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Benefits */}
            <div className="hidden lg:flex flex-1 bg-linear-to-br from-primary-600 to-purple-700 items-center justify-center p-12">
                <div className="max-w-md text-white">
                    <h2 className="text-4xl font-bold mb-6">
                        Join Our Learning Community
                    </h2>
                    <p className="text-primary-100 mb-8 text-lg">
                        Get access to premium content and start your journey towards success.
                    </p>

                    <div className="space-y-4">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="flex items-start space-x-3">
                                <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-1" />
                                <span className="text-lg">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
                        <p className="text-sm text-primary-100 mb-2">Trusted by learners from</p>
                        <p className="text-3xl font-bold">150+ Countries</p>
                    </div>
                </div>
            </div>
        </div>
    );
}