// Local: src/features/theoretical/components/TheoreticalMainPage.tsx

import React, { useState } from 'react';
import { TheoreticalModelsPage } from '../index';
import TemplatesPage from './TemplatesPage';
import ImprovedTestModelForm from './ImprovedTestModelForm';
import { TestModel } from '../../../shared/types';
import { useTheoreticalTests } from '../hooks/useTheoreticalTests';
import { BookOpen, Copy } from 'lucide-react';

// ✅ Definir o tipo localmente  
type UseTheoreticalTestsReturn = ReturnType<typeof useTheoreticalTests>;

type TabType = 'my-models' | 'templates';

const TheoreticalMainPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('my-models');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingModel, setEditingModel] = useState<TestModel | undefined>(undefined);
  
  // ✅ Centralizar o hook em um único local
  const theoreticalTestsHook = useTheoreticalTests();

  const handleCreateModel = () => {
    setEditingModel(undefined);
    setShowCreateForm(true);
  };

  const handleEditModel = (model: TestModel) => {
    setEditingModel(model);
    setShowCreateForm(true);
  };

  const handleSaveModel = (savedModel: TestModel) => {
    // ✅ Após salvar, fechar o modal - a lista já foi atualizada pelo hook
    setShowCreateForm(false);
    setEditingModel(undefined);
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingModel(undefined);
  };

  const handleViewResults = (modelId: string) => {
    console.log('Ver resultados do modelo:', modelId);
  };

  const handleTemplateCreated = () => {
    // Refresh my models when a template is duplicated
    theoreticalTestsHook.fetchModels();
    // Switch to my models tab to see the new model
    setActiveTab('my-models');
  };

  const renderTabButtons = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('my-models')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'my-models'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Meus Modelos
          </div>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'templates'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Templates Disponíveis
          </div>
        </button>
      </nav>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'my-models':
        return (
          <TheoreticalModelsPage
            onCreateModel={handleCreateModel}
            onEditModel={handleEditModel}
            onViewResults={handleViewResults}
            theoreticalTestsHook={theoreticalTestsHook}
          />
        );
      case 'templates':
        return (
          <TemplatesPage
            onTemplateCreated={handleTemplateCreated}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabButtons()}
        {renderActiveTab()}
        
        {showCreateForm && (
          <ImprovedTestModelForm
            model={editingModel}
            onSave={handleSaveModel}
            onCancel={handleCancelForm}
            theoreticalTestsHook={theoreticalTestsHook}
          />
        )}
      </div>
    </div>
  );
};

export default TheoreticalMainPage;
