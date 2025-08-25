// CÓDIGO COMPLETO DO NOVO ARQUIVO
import React from 'react';
interface ProgressBarProps { progress: number; }
const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const cappedProgress = Math.max(0, Math.min(100, progress));
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${cappedProgress}%` }}></div>
    </div>
  );
};
export default ProgressBar;