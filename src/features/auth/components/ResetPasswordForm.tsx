import React, { useState, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const ResetPasswordForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 6) errors.push('Deve ter pelo menos 6 caracteres');
    if (!/[A-Za-z]/.test(pwd)) errors.push('Deve conter pelo menos uma letra');
    if (!/[0-9]/.test(pwd)) errors.push('Deve conter pelo menos um número');
    return errors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validações
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }
    
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Senha inválida: ${passwordErrors.join(', ')}`);
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        throw new Error(data.error || 'Erro ao redefinir senha');
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      setError(error instanceof Error ? error.message : 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Token Inválido</h2>
          <p className="text-gray-600 mb-6">
            O link de recuperação de senha é inválido ou não foi fornecido.
          </p>
          <Link
            to="/forgot-password"
            className="w-full px-4 py-2 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 transition-colors inline-block"
          >
            Solicitar Novo Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Senha Alterada!</h2>
          <p className="text-gray-600 mb-6">
            Sua senha foi alterada com sucesso. Você será redirecionado para o login em alguns segundos.
          </p>
          <Link
            to="/login"
            className="w-full px-4 py-2 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 transition-colors inline-block"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  const passwordErrors = password ? validatePassword(password) : [];
  const isPasswordValid = password && passwordErrors.length === 0;
  const isConfirmValid = confirmPassword && password === confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
            <Lock className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nova Senha</h2>
          <p className="text-gray-600">
            Digite sua nova senha para concluir a recuperação.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  password && !isPasswordValid ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {password && passwordErrors.length > 0 && (
              <div className="mt-1 text-xs text-red-600">
                <ul className="list-disc list-inside">
                  {passwordErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  confirmPassword && !isConfirmValid ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {confirmPassword && !isConfirmValid && (
              <p className="mt-1 text-xs text-red-600">As senhas não coincidem</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs text-gray-600 font-medium mb-1">Requisitos da senha:</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li className={`flex items-center gap-1 ${password.length >= 6 ? 'text-green-600' : ''}`}>
                <div className={`w-1 h-1 rounded-full ${password.length >= 6 ? 'bg-green-600' : 'bg-gray-400'}`} />
                Pelo menos 6 caracteres
              </li>
              <li className={`flex items-center gap-1 ${/[A-Za-z]/.test(password) ? 'text-green-600' : ''}`}>
                <div className={`w-1 h-1 rounded-full ${/[A-Za-z]/.test(password) ? 'bg-green-600' : 'bg-gray-400'}`} />
                Pelo menos uma letra
              </li>
              <li className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-600' : ''}`}>
                <div className={`w-1 h-1 rounded-full ${/[0-9]/.test(password) ? 'bg-green-600' : 'bg-gray-400'}`} />
                Pelo menos um número
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid || !isConfirmValid}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Alterando Senha...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Alterar Senha
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            Voltar ao Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;