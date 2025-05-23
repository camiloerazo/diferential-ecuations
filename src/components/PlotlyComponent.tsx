'use client';

import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import type { Data, Layout, ScatterData } from 'plotly.js';

interface PlotlyComponentProps {
  data: ScatterData[];
  layout?: Partial<Layout>;
  config?: {
    responsive: boolean;
    displayModeBar?: boolean;
    displaylogo?: boolean;
  };
  style?: React.CSSProperties;
}

export default function PlotlyComponent({ data, layout, config, style }: PlotlyComponentProps) {
  const plotRef = useRef<Plot>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentPlot = plotRef.current;
    
    // Reset error state when new data arrives
    setError(null);

    // Validate data
    if (!data || !Array.isArray(data) || data.length === 0) {
      setError('No data available for plotting');
      return;
    }

    // Check if data contains valid points
    const hasValidPoints = data.some(trace => 
      Array.isArray(trace.x) && 
      Array.isArray(trace.y) && 
      trace.x.length > 0 && 
      trace.y.length > 0 &&
      trace.type === 'scatter'
    );

    if (!hasValidPoints) {
      setError('No valid points to plot');
      return;
    }
    
    return () => {
      if (currentPlot) {
        // Cleanup if needed
      }
    };
  }, [data]);

  const defaultLayout: Partial<Layout> = {
    title: {
      text: 'Solution Plot',
      font: {
        size: 20
      }
    },
    xaxis: {
      title: {
        text: 'x',
        font: {
          size: 16
        }
      },
      gridcolor: '#e0e0e0',
      zerolinecolor: '#969696',
      zerolinewidth: 2
    },
    yaxis: {
      title: {
        text: 'y',
        font: {
          size: 16
        }
      },
      gridcolor: '#e0e0e0',
      zerolinecolor: '#969696',
      zerolinewidth: 2
    },
    plot_bgcolor: '#ffffff',
    paper_bgcolor: '#ffffff',
    autosize: true,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    showlegend: true,
    legend: {
      x: 0,
      y: 1
    }
  };

  const defaultConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    scrollZoom: true,
    modeBarButtonsToAdd: ['drawline', 'drawopenpath', 'eraseshape']
  };

  if (error) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-white rounded-lg border border-gray-200">
      <Plot
        ref={plotRef}
        data={data}
        layout={layout || defaultLayout}
        config={config || defaultConfig}
        style={style || { width: '100%', height: '100%' }}
        onError={(err) => {
          console.error('Plotly error:', err);
          setError('Error rendering plot');
        }}
      />
    </div>
  );
} 