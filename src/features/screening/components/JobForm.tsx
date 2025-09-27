import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Building2, MapPin, FileText, CheckSquare, Star, Save, X } from 'lucide-react';
import { JobFormData, JobPosting } from '../types';

interface JobFormProps {
  onFormSubmit: (data: JobFormData) => void;
  onCancel: () => void;
  initialData?: JobPosting;
  isLoading?: boolean;
}

const JobForm: React.FC<JobFormProps> = ({ 
  onFormSubmit, 
  onCancel, 
  initialData, 
  isLoading = false 
}) => {
  const { register, handleSubmit, formState: { errors } } = useForm<JobFormData>({
    defaultValues: {
      jobTitle: initialData?.titulo || '',
      jobDescription: initialData?.descricao || '',
      requiredSkills: initialData?.requisitos_obrigatorios || '',
      desiredSkills: initialData?.requisitos_desejaveis || '',
      endereco: initialData?.endereco || '',
    }
  });

  const onSubmit: SubmitHandler<JobFormData> = (data) => onFormSubmit(data);

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Cabeçalho */}
        <div className="text-center pb-8 border-b border-gray-200">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Building2 size={32} className="text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar Nova Vaga</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Preencha as informações abaixo para criar uma nova vaga e iniciar o processo de triagem
          </p>
        </div>

        {/* Informações Básicas */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-6">
            <Building2 size={20} className="mr-2 text-indigo-600" />
            Informações Básicas
          </h3>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Título da Vaga *
              </label>
              <input
                type="text"
                id="jobTitle"
                {...register('jobTitle', { required: 'O título da vaga é obrigatório' })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-400 ${
                  errors.jobTitle ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Desenvolvedor Full Stack Sênior"
                disabled={isLoading}
              />
              {errors.jobTitle && (
                <p className="mt-2 text-sm text-red-600">{errors.jobTitle.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Localização
              </label>
              <input
                type="text"
                id="endereco"
                {...register('endereco')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-400"
                placeholder="Ex: São Paulo, SP ou Remoto"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Descrição da Vaga */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-6">
            <FileText size={20} className="mr-2 text-indigo-600" />
            Descrição da Vaga
          </h3>
          
          <div>
            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição Completa *
            </label>
            <textarea
              id="jobDescription"
              {...register('jobDescription', { required: 'A descrição da vaga é obrigatória' })}
              rows={8}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-400 resize-none ${
                errors.jobDescription ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Descreva as principais responsabilidades, atividades do dia a dia, objetivos da posição e ambiente de trabalho..."
              disabled={isLoading}
            />
            {errors.jobDescription && (
              <p className="mt-2 text-sm text-red-600">{errors.jobDescription.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Seja específico sobre as responsabilidades e expectativas da função
            </p>
          </div>
        </div>

        {/* Requisitos */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Requisitos Obrigatórios */}
          <div className="bg-red-50 rounded-xl p-6 border border-red-100">
            <h3 className="flex items-center text-lg font-semibold text-red-800 mb-6">
              <CheckSquare size={20} className="mr-2 text-red-600" />
              Requisitos Obrigatórios
            </h3>
            
            <div>
              <label htmlFor="requiredSkills" className="block text-sm font-medium text-red-700 mb-2">
                O que é indispensável?
              </label>
              <textarea
                id="requiredSkills"
                {...register('requiredSkills')}
                rows={6}
                className="w-full px-4 py-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-gray-400 resize-none bg-white"
                placeholder="• Graduação em área relacionada&#10;• 3+ anos de experiência com React&#10;• Conhecimento em Node.js&#10;• Inglês intermediário"
                disabled={isLoading}
              />
              <p className="text-xs text-red-600 mt-2">
                Liste apenas os requisitos essenciais para a função
              </p>
            </div>
          </div>

          {/* Requisitos Desejáveis */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-100">
            <h3 className="flex items-center text-lg font-semibold text-green-800 mb-6">
              <Star size={20} className="mr-2 text-green-600" />
              Requisitos Desejáveis
            </h3>
            
            <div>
              <label htmlFor="desiredSkills" className="block text-sm font-medium text-green-700 mb-2">
                O que seria um diferencial?
              </label>
              <textarea
                id="desiredSkills"
                {...register('desiredSkills')}
                rows={6}
                className="w-full px-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors placeholder-gray-400 resize-none bg-white"
                placeholder="• Experiência com TypeScript&#10;• Conhecimento em AWS&#10;• Certificações relacionadas&#10;• Experiência em metodologias ágeis"
                disabled={isLoading}
              />
              <p className="text-xs text-green-600 mt-2">
                Liste qualificações que agregariam valor à candidatura
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <X size={18} className="mr-2" />
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium min-w-[160px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                {initialData ? 'Salvar Alterações' : 'Criar Vaga'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;