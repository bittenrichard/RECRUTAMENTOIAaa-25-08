import React from 'react';
import { ArrowLeft, AlertCircle, Building2 } from 'lucide-react';
import JobForm from './JobForm';
import { useJobForm } from '../hooks/useJobForm';
import { JobPosting, JobFormData } from '../types';

interface NewScreeningPageProps {
  onJobCreated: (newJob: JobPosting) => void;
  onCancel: () => void;
}

const NewScreeningPage: React.FC<NewScreeningPageProps> = ({
  onJobCreated,
  onCancel
}) => {
  const { isSubmitting, error, submitJob, resetForm } = useJobForm();

  const handleFormSubmit = async (formData: JobFormData) => {
    const newJob = await submitJob(formData);
    if (newJob) {
      resetForm();
      onJobCreated(newJob);
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleCancel}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                <ArrowLeft size={20} className="mr-2" />
                Voltar
              </button>
              <div className="ml-6 flex items-center">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <Building2 size={16} className="text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Nova Triagem de Vaga</h1>
                  <p className="text-sm text-gray-600">Criar e configurar uma nova oportunidade</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Erro */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Erro ao criar vaga
                </h3>
                <div className="mt-1 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Container do Formulário */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <JobForm
            onFormSubmit={handleFormSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default NewScreeningPage;