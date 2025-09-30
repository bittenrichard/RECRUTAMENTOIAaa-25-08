import React, { useState } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';

interface RejectionReasonModalProps {
  isOpen: boolean;
  candidateName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  isOpen,
  candidateName,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason(''); // Limpar para próxima vez
    }
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-full mr-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Motivo da Reprovação
              </h3>
              <p className="text-sm text-gray-600">
                {candidateName}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
              Digite o motivo da reprovação:
            </label>
            <textarea
              id="rejectionReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Não atendeu aos requisitos técnicos, falta de experiência na área, etc."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-700">
              <strong>Atenção:</strong> Esta ação irá reprovar o candidato permanentemente. 
              O motivo será registrado no sistema.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!reason.trim() || isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar Reprovação
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectionReasonModal;