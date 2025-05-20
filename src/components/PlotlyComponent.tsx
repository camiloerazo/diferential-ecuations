'use client';

import { useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';

interface PlotData {
  x: number[];
  y: number[];
}

interface PlotlyComponentProps {
  data: PlotData;
}

export default function PlotlyComponent({ data }: PlotlyComponentProps) {
  const plotRef = useRef<Plot>(null);

  useEffect(() => {
    const currentPlot = plotRef.current;
    
    return () => {
      if (currentPlot) {
        // Cleanup if needed
      }
    };
  }, []);

  return (
    <div className="w-full h-[400px]">
      <Plot
        ref={plotRef}
        data={[
          {
            x: data.x,
            y: data.y,
            type: 'scatter',
            mode: 'lines',
            name: 'Solution',
          },
        ]}
        layout={{
          title: 'Solution Plot',
          xaxis: { title: 'x' },
          yaxis: { title: 'y' },
          autosize: true,
          margin: { l: 50, r: 50, t: 50, b: 50 },
        }}
        config={{ responsive: true }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
} 