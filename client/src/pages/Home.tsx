import type React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Video, Users, Award, TrendingUp, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    const features = [
        {
            icon: BookOpen,
            title: 'Interactive Courses',
            description: 'Access hundreds of courses with rich multimedia content and interactive exercises.',
            color: 'bg-blue-500'
        },
        {
            icon: Video,
            title: 'Live Classes',
            description: 'Join live sessions with expert instructors and interact in real-time.',
            color: 'bg-purple-500'
        },
        {
            icon: Users,
            title: 'Collaborative Learning',
            description: 'Engage with peers through discussions, group projects, and forums.',
            color: 'bg-green-500'
        },
        {
            icon: Award,
            title: 'Certificates',
            description: 'Earn recognized certificates upon course completion to boost your career.',
            color: 'bg-yellow-500'
        },
        {
            icon: TrendingUp,
            title: 'Progress Tracking',
            description: 'Monitor your learning journey with detailed analytics and insights.',
            color: 'bg-red-500'
        },
        {
            icon: CheckCircle,
            title: 'Assignments & Quizzes',
            description: 'Test your knowledge with interactive assessments and instant feedback.',
            color: 'bg-indigo-500'
        }
    ];

    const stats = [
        { label: 'Active Students', value: '50,000+' },
        { label: 'Expert Instructors', value: '1,200+' },
        { label: 'Courses Available', value: '5,000+' },
        { label: 'Countries Reached', value: '150+' }
    ];

    const testimonials = [
        {
            name: 'Sarah Johnson',
            role: 'Web Developer',
            image: 'https://randomuser.me/api/portraits/women/1.jpg',
            text: 'This platform transformed my career! The courses are well-structured and the instructors are amazing.',
            rating: 5
        },
        {
            name: 'Michael Chen',
            role: 'Data Scientist',
            image: 'https://randomuser.me/api/portraits/men/2.jpg',
            text: 'I love the flexibility and the quality of content. Highly recommended for anyone looking to upskill.',
            rating: 5
        },
        {
            name: 'Emily Rodriguez',
            role: 'Marketing Manager',
            image: 'https://randomuser.me/api/portraits/women/3.jpg',
            text: 'The live classes and interactive assignments make learning engaging and effective.',
            rating: 5
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-xl font-bold text-white">L</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-900">LMS Platform</span>
                        </div>

                        <div className="hidden md:flex space-x-8">
                            <a href="#features" className="text-gray-700 hover:text-primary-600 transition-colors">Features</a>
                            <a href="#about" className="text-gray-700 hover:text-primary-600 transition-colors">About</a>
                            <a href="#testimonials" className="text-gray-700 hover:text-primary-600 transition-colors">Testimonials</a>
                            <a href="#contact" className="text-gray-700 hover:text-primary-600 transition-colors">Contact</a>
                        </div>

                        <div className="flex items-center space-x-4">
                            {isAuthenticated ? (
                                <Button onClick={() => navigate('/dashboard')}>
                                    Go to Dashboard
                                </Button>
                            ) : (
                                <>
                                    <Button variant="primary" onClick={() => navigate('/login')}>
                                        Sign In
                                    </Button>
                                    <Button onClick={() => navigate('/register')}>
                                        Get Started
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 bg-linear-to-br from-primary-50 to-purple-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                                Learn Without Limits
                            </h1>
                            <p className="text-xl text-gray-600 mt-6">
                                Access world-class education from anywhere. Join thousands of learners
                                advancing their careers with our interactive platform.
                            </p>
                            <div className="flex gap-4 mt-8">
                                <Button size="lg" onClick={() => navigate('/register')}>
                                    Start Learning Free
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                                <Button size="lg" variant="secondary" onClick={() => navigate('/courses')}>
                                    Browse Courses
                                </Button>
                            </div>
                            <div className="flex gap-8 mt-8 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                    <span>No credit card required</span>
                                </div>
                                <div className="flex items-center">
                                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                    <span>14-day free trial</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <img
                                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800"
                                alt="Students learning"
                                className="rounded-2xl shadow-2xl"
                            />
                            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <Users className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">50K+</p>
                                        <p className="text-sm text-gray-600">Active Learners</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-primary-600">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <p className="text-4xl font-bold text-white">{stat.value}</p>
                                <p className="text-primary-100 mt-2">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900">
                            Everything You Need to Succeed
                        </h2>
                        <p className="text-xl text-gray-600 mt-4">
                            Powerful features designed to enhance your learning experience
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <Card key={index} className="hover:shadow-xl transition-shadow">
                                    <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600">
                                        {feature.description}
                                    </p>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 px-4 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900">
                            What Our Students Say
                        </h2>
                        <p className="text-xl text-gray-600 mt-4">
                            Join thousands of satisfied learners worldwide
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index}>
                                <div className="flex mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                                <div className="flex items-center">
                                    <img
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full mr-4"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-primary-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Start Your Learning Journey?
                    </h2>
                    <p className="text-xl text-primary-100 mb-8">
                        Join our community of learners and unlock your potential today.
                    </p>
                    <Button
                        size="lg"
                        variant="secondary"
                        onClick={() => navigate('/register')}
                    >
                        Get Started for Free
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                    <span className="text-lg font-bold text-white">L</span>
                                </div>
                                <span className="text-xl font-bold text-white">LMS Platform</span>
                            </div>
                            <p className="text-sm">
                                Empowering learners worldwide with quality education.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-white mb-4">Product</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white">Features</a></li>
                                <li><a href="#" className="hover:text-white">Pricing</a></li>
                                <li><a href="#" className="hover:text-white">Courses</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-white mb-4">Company</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white">About Us</a></li>
                                <li><a href="#" className="hover:text-white">Careers</a></li>
                                <li><a href="#" className="hover:text-white">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-white mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
                        <p>&copy; 2025 LMS Platform. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}