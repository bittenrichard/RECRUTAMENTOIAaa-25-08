import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { JobFormData, JobPosting } from '../types';

interface JobFormProps {
  onFormSubmit: (data: JobFormData) => void;
  onCancel: () => void;
  initialData?: JobPosting;
  isLoading?: boolean;
}

const JobForm: React.FC<JobFormProps> = ({ onFormSubmit, onCancel, initialData, isLoading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<JobFormData>({
    defaultValues: {
      titulo: initialData?.titulo || '',
      descricao: initialData?.descricao || '',
      requisitos_obrigatorios: initialData?.requisitos_obrigatorios || '',
      requisitos_desejaveis: initialData?.requisitos_desejaveis || '',
      endereco: initialData?.Endereco || '',
    }
  });

  const onSubmit: SubmitHandler<JobFormData> = data => onFormSubmit(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 sm:p-8 rounded-lg shadow-md space-y-6">
      <div>
        <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título da Vaga</label>
        <input type="text" id="titulo" {...register('titulo', { required: 'O título é obrigatório' })} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.titulo ? 'border-red-500' : ''}`} />
        {errors.titulo && <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>}
      </div>

       <div>
        <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">Endereço (Cidade, Estado)</label>
        <input type="text" id="endereco" {...register('endereco')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>

      <div>
        <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição da Vaga</label>
        <textarea id="descricao" {...register('descricao', { required: 'A descrição é obrigatória' })} rows={6} className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${errors.descricao ? 'border-red-500' : ''}`}></textarea>
        {errors.descricao && <p className="mt-1 text-sm text-red-600">{errors.descricao.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="requisitos_obrigatorios" className="block text-sm font-medium text-gray-700">Requisitos Obrigatórios</label>
          <textarea id="requisitos_obrigatorios" {...register('requisitos_obrigatorios')} rows={5} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>
        <div>
          <label htmlFor="requisitos_desejaveis" className="block text-sm font-medium text-gray-700">Requisitos Desejáveis</label>
          <textarea id="requisitos_desejaveis" {...register('requisitos_desejaveis')} rows={5} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>
      </div>
      
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="w-full sm:w-auto justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancelar</button>
        <button type="submit" disabled={isLoading} className="w-full sm:w-auto justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          {isLoading ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Criar Vaga')}
        </button>
      </div>
    </form>
  );
};

export default JobForm;