// src/features/agenda/components/EditEventModal.tsx

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface GoogleCalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  htmlLink: string;
  status: string;
}

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: GoogleCalendarEvent | null;
  onSave: (eventData: Partial<GoogleCalendarEvent>) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
}

const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  event,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      setFormData({
        title: event.title || '',
        description: event.description || '',
        start: event.start,
        end: event.end,
        location: event.location || '',
        startDate: format(startDate, 'yyyy-MM-dd'),
        startTime: format(startDate, 'HH:mm'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        endTime: format(endDate, 'HH:mm'),
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setIsLoading(true);
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const eventData = {
        title: formData.title,
        description: formData.description,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        location: formData.location,
      };

      await onSave(eventData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    setIsLoading(true);
    try {
      await onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      alert('Erro ao excluir evento. Tente novamente.');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Editar Evento</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {showDeleteConfirm ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="mt-3 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Excluir Evento</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Tem certeza que deseja excluir o evento "{event.title}"? Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Título
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    Hora de Início
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    Data de Término
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                    Hora de Término
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Local
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Opcional"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700"
                >
                  Excluir Evento
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;