import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../../shared/utils/authFetch';

export const StatsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const matchId = searchParams.get('matchId');
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    if (!matchId) {
      navigate('/config');
      return;
    }

    authFetch(`/partidos/${matchId}`).then(setMatchData).catch(console.error);
  }, [matchId, navigate]);

  if (!matchData) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Estadísticas en Vivo</h1>
      <h2 className="text-xl text-gray-600 mb-8">{matchData.equipoLocal?.nombre} vs {matchData.equipoVisitante?.nombre}</h2>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <p className="text-gray-500 italic">
          El módulo de carga de estadísticas set a set está en desarrollo.
          Aquí el asistente podrá cargar puntos, asistencias y bloqueos en tiempo real.
        </p>
      </div>
    </div>
  );
};
