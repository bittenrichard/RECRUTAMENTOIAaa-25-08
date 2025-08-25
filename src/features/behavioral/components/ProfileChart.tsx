// Caminho do arquivo: src/features/behavioral/components/ProfileChart.tsx
// SUBSTITUA O CONTEÚDO INTEIRO DESTE ARQUIVO POR ESTE CÓDIGO

import React from 'react';

interface ProfileChartProps {
  data: {
    executor: number | string | null;
    comunicador: number | string | null;
    planejador: number | string | null;
    analista: number | string | null;
  };
}

const ProfileChart: React.FC<ProfileChartProps> = ({ data }) => {
  const profiles = [
    { name: 'Executor', value: data.executor, color: 'bg-red-500' },
    { name: 'Comunicador', value: data.comunicador, color: 'bg-yellow-500' },
    { name: 'Planejador', value: data.planejador, color: 'bg-green-500' },
    { name: 'Analista', value: data.analista, color: 'bg-blue-500' },
  ];

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Perfis Comportamentais</h3>
      <div className="space-y-4">
        {profiles.map(profile => {
          // --- INÍCIO DA CORREÇÃO ---
          // Garantimos que o valor seja um número antes de usá-lo.
          // O fallback `|| 0` trata casos de `null` ou `undefined`.
          const numericValue = Number(profile.value || 0);
          // --- FIM DA CORREÇÃO ---

          return (
            <div key={profile.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{profile.name}</span>
                {/* Usamos a variável numérica para formatar o texto */}
                <span className="text-sm font-bold text-gray-800">{numericValue.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                {/* E também para definir a largura da barra */}
                <div
                  className={`${profile.color} h-4 rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${numericValue}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileChart;