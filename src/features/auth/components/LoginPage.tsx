import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import { useAuth } from '../hooks/useAuth';
import { LoginCredentials } from '../types';

const LoginPage: React.FC = () => {
  const { signIn, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (credentials: LoginCredentials) => {
    const success = await signIn(credentials);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center p-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Recruta.<span className="text-indigo-600">AI</span>
        </h1>
        <h2 className="mt-2 text-center text-xl text-gray-600">
          Acesse sua conta
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm" role="alert">
                <p>{error}</p>
            </div>
           )}
          <p className="mt-6 text-center text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;