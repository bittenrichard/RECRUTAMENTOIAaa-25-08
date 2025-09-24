// Local: src/features/theoretical/index.ts

// Componentes principais
export { default as TheoreticalModelsPage } from './components/TheoreticalModelsPage';
export { default as TestModelForm } from './components/TestModelForm';
export { default as ImprovedTestModelForm } from './components/ImprovedTestModelForm';
export { default as TheoreticalTestPage } from './components/TheoreticalTestPage';
export { default as TheoreticalMainPage } from './components/TheoreticalMainPage';
export { default as PublicTheoreticalTestPage } from './components/PublicTheoreticalTestPage';

// Hooks
export { default as useTheoreticalTests } from './hooks/useTheoreticalTests';

// Re-export dos tipos específicos da feature
export type {
  TestModel,
  Question,
  QuestionType,
  AppliedTest,
  CandidateTestData,
  TestResult,
  TestSubmission,
  TestStatus
} from '../../shared/types';