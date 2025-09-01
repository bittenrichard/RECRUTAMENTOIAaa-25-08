import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import MainLayout from './MainLayout';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, profile, signOut } = useAuth();

  if (!isAuthenticated || !profile) {
    return <Navigate to="/login" />;
  }
  
  const handleLogout = () => {
    signOut();
  };

  return (
    <MainLayout user={profile} onLogout={handleLogout}>
      <Outlet /> 
    </MainLayout>
  );
};

export default ProtectedRoute;