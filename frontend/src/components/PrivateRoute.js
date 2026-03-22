import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

const PrivateRoute = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();
    const location = useLocation();


    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Yetki kontrol ediliyor..." />
            </div>
        );
    }


    if (!user) {

        return <Navigate to="/login" state={{ from: location }} replace />;
    }


    if (requiredRole && user.role !== requiredRole) {

        const redirectPath = user.role === 'ADMIN' ? '/admin' : '/dashboard';
        return <Navigate to={redirectPath} replace />;
    }


    return children;
};

export default PrivateRoute;