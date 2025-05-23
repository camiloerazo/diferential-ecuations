'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { Data, Layout, ScatterData } from 'plotly.js';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(
  () => import('@/components/PlotlyComponent'),
  { 
    ssr: false,
    loading: () => <div>Loading plot...</div>
  }
);

interface ApiResponse {
  solution: string;
  error?: string;
  plotImage?: {
    url: string;
    alt: string;
  } | null;
}

interface ApiError {
  error: string;
}

export default function Home() {
  const [equation, setEquation] = useState('');
  const [initialCondition, setInitialCondition] = useState('');
  const [solution, setSolution] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plotImage, setPlotImage] = useState<{ url: string; alt: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSolution(null);
    setPlotImage(null);

    try {
      console.log('Sending equation:', equation);
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          equation,
          initialCondition: initialCondition.trim() || undefined
        }),
      });

      console.log('Response status:', response.status);
      const data: ApiResponse = await response.json();
      console.log('Response data:', data);

      if (data.error) {
        console.log('Server returned error:', data.error);
        setError(data.error);
        return;
      }

      setSolution(data.solution);
      if (data.plotImage) {
        setPlotImage(data.plotImage);
      } else {
        setError('No se pudo generar la gráfica para esta solución');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al procesar la ecuación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* University and Teacher Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Image 
              src="/logou.png" 
              alt="Logo Universidad Cooperativa de Colombia" 
              width={64}
              height={64}
              className="mr-4"
            />
            <div>
              <p className="text-lg font-semibold">Universidad Cooperativa de Colombia</p>
              <p className="text-md text-gray-700">Docente: Yesika Viviana Ñañez</p>
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-8 text-center">Solver de Ecuaciones Diferenciales</h1>
        
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
          <div>
            <label htmlFor="equation" className="block text-sm font-medium text-gray-700 mb-1">
              Ecuación Diferencial:
            </label>
            <input
              id="equation"
              type="text"
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              placeholder="Ejemplo: dy/dx = 2 * x * y"
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label htmlFor="initialCondition" className="block text-sm font-medium text-gray-700 mb-1">
              Condición Inicial (opcional):
            </label>
            <input
              id="initialCondition"
              type="text"
              value={initialCondition}
              onChange={(e) => setInitialCondition(e.target.value)}
              placeholder="Ejemplo: y(0) = 1"
              className="w-full p-2 border rounded"
            />
            <p className="mt-1 text-sm text-gray-500">
              Ingresa una condición inicial para obtener una solución particular
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isLoading ? 'Procesando...' : 'Resolver'}
          </button>
        </form>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {solution && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Solución:</h2>
            <div className="p-4 bg-gray-50 rounded">
              <p className="text-lg text-gray-800 dark:text-gray-800">{solution}</p>
            </div>
          </div>
        )}

        {plotImage && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Gráfica:</h2>
            <div className="flex justify-center">
              <Image
                src={plotImage.url}
                alt={plotImage.alt}
                width={800}
                height={600}
                className="max-w-full h-auto border rounded shadow-lg"
              />
            </div>
            <div className="mt-4 text-center text-gray-600">
              <p className="mb-2"><strong>Gráfica de la solución:</strong> Muestra cómo cambia y con respecto a x.</p>
              <p><strong>Gráfica adicional:</strong> Puede mostrar la relación entre la función y su derivada, o la familia de soluciones.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 pb-4 text-center text-white bg-gray-800">
        <div className="container mx-auto px-4">
          <p className="text-sm">
            Integrantes: 
            <span className="mx-2">Programador: Juan Camilo Erazo</span> -
            <span className="mx-2">Eiler Fernando Rosero</span> -
            <span className="mx-2">Mauricio Ordoñez</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
