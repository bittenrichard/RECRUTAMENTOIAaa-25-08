// Local: src/features/theoretical/components/TheoreticalMainPage.tsx

import React, { useState } from 'react';
import { TheoreticalModelsPage } from '../index';
import ImprovedTestModelForm from './ImprovedTestModelForm';
import { TestModel } from '../../../shared/types';
import { useTheoreticalTests } from '../hooks/useTheoreticalTests';

// ✅ Definir o tipo localmente  
type UseTheoreticalTestsReturn = ReturnType<typeof useTheoreticalTests>;

const TheoreticalMainPage: React.FC = () => {
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

  return (
    <>
      <TheoreticalModelsPage
        onCreateModel={handleCreateModel}
        onEditModel={handleEditModel}
        onViewResults={handleViewResults}
        theoreticalTestsHook={theoreticalTestsHook}
      />
      
      {showCreateForm && (
        <ImprovedTestModelForm
          model={editingModel}
          onSave={handleSaveModel}
          onCancel={handleCancelForm}
          theoreticalTestsHook={theoreticalTestsHook}
        />
      )}
    </>
  );
};

export default TheoreticalMainPage;
