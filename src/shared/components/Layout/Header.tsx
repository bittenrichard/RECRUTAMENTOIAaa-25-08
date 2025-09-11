import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/nova-triagem')) return 'Nova Triagem';
    if (path.includes('/resultados')) return 'Resultados da Triagem';
    if (path.includes('/editar')) return 'Editar Vaga';
    if (path.startsWith('/banco-de-talentos')) return 'Banco de Talentos';
    if (path.startsWith('/agenda')) return 'Agenda';
    if (path.startsWith('/configuracoes')) return 'Configurações';
    return 'Recruta.AI';
  };

  return (
    <header className="flex items-center h-20 px-6 sm:px-10 bg-white shadow-sm flex-shrink-0 z-10">
      {/* Este botão só aparece em telas menores que 'md' (768px) */}
      <button 
        onClick={onToggleMobileMenu}
        className="md:hidden mr-4 text-gray-600 hover:text-indigo-600"
        aria-label="Abrir menu"
      >
        <Menu size={28} />
      </button>

      <h1 className="text-2xl font-semibold text-gray-800">
        {getPageTitle()}
      </h1>
    </header>
  );
};

export default Header;