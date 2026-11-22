import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[];
    children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.isBlocked) {
        return <Navigate to="/suspended" replace />;
    }

    // Check role if allowedRoles is specified
    if (allowedRoles && allowedRoles.length > 0) {
        const hasAccess = allowedRoles.includes(user.role || '');
        if (!hasAccess) {
            // Redirect to appropriate dashboard based on user's actual role
            if (user.role === 'Teacher') {
                return <Navigate to="/teacher/dashboard" replace />;
            } else if (user.role === 'Student') {
                return <Navigate to="/student/dashboard" replace />;
            }
            return <Navigate to="/" replace />;
        }
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
