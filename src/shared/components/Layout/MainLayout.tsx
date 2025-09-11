import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { UserProfile } from '../../../features/auth/types';

interface MainLayoutProps {
  user: UserProfile | null;
  onLogout: () => void;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  user,
  onLogout,
  children
}) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  const toggleMobileMenu = () => setMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar 
        onLogout={onLogout}
        user={user}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className="flex flex-col flex-grow relative overflow-hidden">
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
        )}
        <Header 
          onToggleMobileMenu={toggleMobileMenu}
        />
        {/* --- ALTERAÇÃO APLICADA AQUI --- */}
        {/* Adicionamos padding responsivo ao container principal do conteúdo */}
        <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;