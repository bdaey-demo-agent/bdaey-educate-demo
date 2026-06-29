import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicOnlyRoute: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (user) {
        // Redirect based on role
        if (user.role === 'Student') return <Navigate to="/student/home" replace />;
        if (user.role === 'Teacher') return <Navigate to="/teacher/home" replace />;
        if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;

        // Default fallback
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PublicOnlyRoute;
