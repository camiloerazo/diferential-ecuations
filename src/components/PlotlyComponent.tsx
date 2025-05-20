'use client';

import { useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';

interface PlotlyComponentProps {
  data: Data[];
  layout?: Partial<Layout>;
  config?: {
    responsive: boolean;
  };
  style?: React.CSSProperties;
}

export default function PlotlyComponent({ data, layout, config, style }: PlotlyComponentProps) {
  const plotRef = useRef<Plot>(null);

  useEffect(() => {
    const currentPlot = plotRef.current;
    
    return () => {
      if (currentPlot) {
        // Cleanup if needed
      }
    };
  }, []);

  const defaultLayout: Partial<Layout> = {
    title: {
      text: 'Solution Plot'
    },
    xaxis: {
      title: {
        text: 'x'
      }
    },
    yaxis: {
      title: {
        text: 'y'
      }
    },
    autosize: true,
    margin: { l: 50, r: 50, t: 50, b: 50 },
  };

  return (
    <div className="w-full h-[400px]">
      <Plot
        ref={plotRef}
        data={data}
        layout={layout || defaultLayout}
        config={config || { responsive: true }}
        style={style || { width: '100%', height: '100%' }}
      />
    </div>
  );
} 