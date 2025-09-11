import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import UpdateProfileForm from './UpdateProfileForm';
import UpdatePasswordForm from './UpdatePasswordForm';
import { useGoogleAuth } from '../../../shared/hooks/useGoogleAuth';
import { CheckCircle, Zap } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { profile } = useAuth();
    const { isGoogleConnected, connectGoogleAccount, disconnectGoogleAccount, isConnecting } = useGoogleAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'integrations'>('profile');

    if (!profile) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <UpdateProfileForm />;
            case 'password':
                return <UpdatePasswordForm />;
            case 'integrations':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Google Calendar</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Conecte sua conta do Google para agendar entrevistas diretamente no seu calendário e enviar convites para os candidatos.
                            </p>
                        </div>
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                            <div className="flex-grow">
                                <h4 className="font-semibold text-gray-800">Status da Conexão</h4>
                                {isGoogleConnected ? (
                                    <p className="text-green-600 flex items-center gap-2"><CheckCircle size={16} />Conectado com sucesso</p>
                                ) : (
                                    <p className="text-gray-600">Nenhuma conta conectada</p>
                                )}
                            </div>
                            {isGoogleConnected ? (
                                <button onClick={disconnectGoogleAccount} className="px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
                                    Desconectar
                                </button>
                            ) : (
                                <button onClick={connectGoogleAccount} disabled={isConnecting} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                                    {isConnecting ? 'Conectando...' : 'Conectar Conta Google'}
                                </button>
                            )}
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="fade-in max-w-4xl mx-auto space-y-8">
             <div className="flex flex-col sm:flex-row items-baseline sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
                    <p className="text-gray-500 mt-1">Gerencie suas informações e integrações.</p>
                </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8">
                <nav className="flex flex-row lg:flex-col gap-2 lg:w-1/4">
                    <button onClick={() => setActiveTab('profile')} className={`px-3 py-2 text-sm font-medium rounded-md text-left ${activeTab === 'profile' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>Meu Perfil</button>
                    <button onClick={() => setActiveTab('password')} className={`px-3 py-2 text-sm font-medium rounded-md text-left ${activeTab === 'password' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>Senha</button>
                    <button onClick={() => setActiveTab('integrations')} className={`px-3 py-2 text-sm font-medium rounded-md text-left ${activeTab === 'integrations' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>Integrações</button>
                </nav>
                <div className="flex-1 bg-white p-6 sm:p-8 rounded-lg shadow-md">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;