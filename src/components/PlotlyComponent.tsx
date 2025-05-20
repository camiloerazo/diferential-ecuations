'use client';

import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface PlotlyComponentProps {
  data: any[];
  layout: any;
  config?: any;
  style?: React.CSSProperties;
}

const PlotlyComponent = ({ data, layout, config, style }: PlotlyComponentProps) => {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plotRef.current) return;

    // Clean up previous plot
    Plotly.purge(plotRef.current);

    // Create new plot
    Plotly.newPlot(plotRef.current, data, layout, {
      responsive: true,
      ...config
    });

    // Handle window resize
    const handleResize = () => {
      if (plotRef.current) {
        Plotly.relayout(plotRef.current, {
          'xaxis.autorange': true,
          'yaxis.autorange': true
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (plotRef.current) {
        Plotly.purge(plotRef.current);
      }
    };
  }, [data, layout, config]);

  return (
    <div 
      ref={plotRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        ...style 
      }} 
    />
  );
};

export default PlotlyComponent; 