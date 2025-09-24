import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Loader2 } from 'lucide-react';

import { useAuth } from './features/auth/hooks/useAuth';
import { useDataStore } from './shared/store/useDataStore';

import LoginPage from './features/auth/components/LoginPage';
import SignUpPage from './features/auth/components/SignUpPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import DashboardPage from './features/dashboard/components/DashboardPage';
import NewScreeningPage from './features/screening/components/NewScreeningPage';
import EditScreeningPage from './features/screening/components/EditScreeningPage';
import ResultsPage from './features/results/components/ResultsPage';
import SettingsPage from './features/settings/components/SettingsPage';
import CandidateDatabasePage from './features/database/components/CandidateDatabasePage';
import AgendaPage from './features/agenda/components/AgendaPage';
import { PublicTestPage } from './features/behavioral/components';
import { TheoreticalMainPage, TheoreticalTestPage } from './features/theoretical';
import ProtectedRoute from './shared/components/Layout/ProtectedRoute';
import MainLayout from './shared/components/Layout/MainLayout';

const LoadingSpinner: React.FC = () => (
  <div className="flex h-full flex-col items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
      <h2 className="mt-6 text-xl font-semibold text-gray-800">Carregando Dados...</h2>
      <p className="mt-2 text-gray-500">Estamos buscando as informações mais recentes.</p>
    </div>
  </div>
);

function App() {
  const { profile, isAuthenticated, isLoading: isAuthLoading, signOut } = useAuth();
  const { isDataLoading, fetchAllData } = useDataStore();
  const navigate = useNavigate();
  const location = useLocation();

  const path = window.location.pathname;
  if (path.startsWith('/teste/')) {
    const testId = path.split('/')[2];
    return <PublicTestPage testId={testId} />;
  }

  useEffect(() => {
    if (isAuthenticated && profile) {
      fetchAllData(profile);
    }
  }, [isAuthenticated, profile, fetchAllData]);
  
  useEffect(() => {
    if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/')) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, location.pathname, navigate]);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  if (isAuthLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="font-inter antialiased">
      <DndProvider backend={HTML5Backend}>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
          <Route path="/signup" element={!isAuthenticated ? <SignUpPage /> : <Navigate to="/dashboard" />} />
          <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/dashboard" />} />
          <Route path="/reset-password/:token" element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/dashboard" />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={
              <MainLayout user={profile} onLogout={handleLogout}>
                {isDataLoading ? <LoadingSpinner /> : (
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/nova-triagem" element={<NewScreeningPage />} />
                    <Route path="/vaga/:jobId/editar" element={<EditScreeningPage />} />
                    <Route path="/vaga/:jobId/resultados" element={<ResultsPage />} />
                    <Route path="/configuracoes" element={<SettingsPage />} />
                    <Route path="/banco-de-talentos" element={<CandidateDatabasePage />} />
                    <Route path="/provas-teoricas" element={<TheoreticalMainPage />} />
                    <Route path="/agenda" element={<AgendaPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                )}
              </MainLayout>
            } />
          </Route>
        </Routes>
      </DndProvider>
    </div>
  );
}

export default App;