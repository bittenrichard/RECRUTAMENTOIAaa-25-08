import React, { useState, useRef } from 'react';
import { X, Upload, Video, AlertCircle, CheckCircle } from 'lucide-react';
import { Candidate } from '../../../shared/types';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  onVideoUploaded: () => void;
}

const VideoUploadModal: React.FC<VideoUploadModalProps> = ({ isOpen, onClose, candidate, onVideoUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/mov'];

    if (file.size > maxSize) {
      setUploadError('O arquivo deve ter no máximo 100MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Formato não suportado. Use MP4, WebM ou MOV');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch(`/api/candidates/${candidate.id}/video-interview`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Falha no upload');

      setUploadSuccess(true);
      setTimeout(() => {
        onVideoUploaded();
        onClose();
      }, 2000);

    } catch (error) {
      setUploadError('Erro ao fazer upload do vídeo');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Upload de Vídeo - Entrevista</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 text-sm">
            <strong>Candidato:</strong> {candidate.nome}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Formatos aceitos: MP4, WebM, MOV (máx. 100MB)
          </p>
        </div>

        {uploadSuccess ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <p className="text-green-600 font-semibold">Vídeo enviado com sucesso!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div 
              onClick={handleFileSelect}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
            >
              {isUploading ? (
                <div className="space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-indigo-600">Enviando vídeo...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Video size={32} className="text-gray-400 mx-auto" />
                  <p className="text-gray-600">Clique para selecionar o vídeo</p>
                  <p className="text-xs text-gray-400">ou arraste e solte aqui</p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-red-700 text-sm">{uploadError}</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/mov"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={isUploading}
          >
            Cancelar
          </button>
          {!uploadSuccess && (
            <button
              onClick={handleFileSelect}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={isUploading}
            >
              <Upload size={16} className="inline mr-2" />
              Selecionar Vídeo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoUploadModal;
