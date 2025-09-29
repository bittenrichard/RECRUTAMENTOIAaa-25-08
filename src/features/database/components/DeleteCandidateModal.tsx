// Local: src/features/database/components/DeleteCandidateModal.tsx

import React from 'react';
import { Trash2, X } from 'lucide-react';

interface DeleteCandidateModalProps {
  candidateName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteCandidateModal: React.FC<DeleteCandidateModalProps> = ({
  candidateName,
  onClose,
  onConfirm,
  isDeleting
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Excluir Candidato</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeleting}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700">
            Tem certeza que deseja excluir <strong>{candidateName}</strong> do banco de talentos?
          </p>
          <p className="text-sm text-red-600 mt-2">
            ⚠️ Esta ação não pode ser desfeita. Todos os dados do candidato serão permanentemente removidos.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 size={14} className="mr-2" />
                Excluir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCandidateModal;