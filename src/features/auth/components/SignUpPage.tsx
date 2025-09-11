import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SignUpForm from './SignUpForm';
import { useAuth } from '../hooks/useAuth';
import { SignUpCredentials } from '../types';

const SignUpPage: React.FC = () => {
  const { signUp, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (credentials: SignUpCredentials) => {
    const success = await signUp(credentials);
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
          Crie sua conta
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <SignUpForm onSubmit={handleSignUp} isLoading={isLoading} />
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm" role="alert">
                <p>{error}</p>
            </div>
          )}
           <p className="mt-6 text-center text-sm text-gray-600">
            Já possui uma conta?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;