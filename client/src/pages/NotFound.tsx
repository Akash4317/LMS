// src/pages/NotFound.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        {/* Big 404 */}
        <h1 className="text-9xl font-bold text-primary-600 mb-4">
          404
        </h1>
        
        {/* Error Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Page Not Found
        </h2>
        
        <p className="text-gray-600 mb-2">
          The page <code className="bg-gray-200 px-2 py-1 rounded">
            {location.pathname}
          </code> doesn't exist.
        </p>
        
        <p className="text-gray-600 mb-8">
          It might have been moved or deleted.
        </p>
        
        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate(-1)} variant="secondary">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
          
          <Button onClick={() => navigate('/dashboard')}>
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
};