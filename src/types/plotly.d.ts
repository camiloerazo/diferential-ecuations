declare module 'plotly.js-dist-min' {
  import { Data, Layout, Config } from 'plotly.js';

  const Plotly: {
    newPlot: (
      element: HTMLElement,
      data: Data[],
      layout?: Partial<Layout>,
      config?: Partial<Config>
    ) => void;
    purge: (element: HTMLElement) => void;
    relayout: (element: HTMLElement, update: Partial<Layout>) => void;
  };
  export default Plotly;
} 