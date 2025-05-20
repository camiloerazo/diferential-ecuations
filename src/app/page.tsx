'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Data, Layout } from 'plotly.js';

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
  plotData: {
    data: Data[];
    layout: Partial<Layout>;
  };
  wolframData?: unknown;
}

interface ApiError {
  error: string;
}

export default function Home() {
  const [equation, setEquation] = useState('');
  const [solution, setSolution] = useState('');
  const [plotData, setPlotData] = useState<ApiResponse['plotData'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wolframData, setWolframData] = useState<unknown | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Sending equation:', equation);
      
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ equation: equation.trim() }),
      });

      console.log('Response status:', response.status);
      
      const data = await response.json() as ApiResponse | ApiError;
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error((data as ApiError).error || 'Failed to solve equation');
      }

      const solutionData = data as ApiResponse;
      setSolution(solutionData.solution);
      setPlotData(solutionData.plotData);
      setWolframData(solutionData.wolframData);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'An error occurred while solving the equation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Differential Equation Solver
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="equation" className="block text-sm font-medium mb-2">
            Enter your differential equation:
          </label>
          <input
            type="text"
            id="equation"
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
            placeholder="Example: dy/dx = x^2 + y"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-sm text-gray-500">
            Examples: dy/dx = x^2, dy/dx = sin(x), d²y/dx² + dy/dx + y = 0
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Solving...' : 'Solve Equation'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {solution && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Solution:</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-mono">{solution}</p>
          </div>
        </div>
      )}

      {plotData && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Plot:</h2>
          <div className="w-full h-[400px]">
            <Plot
              data={plotData.data}
              layout={plotData.layout}
              config={{ responsive: true }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
