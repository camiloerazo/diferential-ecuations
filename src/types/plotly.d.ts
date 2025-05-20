declare module 'plotly.js-dist-min' {
  const Plotly: {
    newPlot: (
      element: HTMLElement,
      data: any[],
      layout?: any,
      config?: any
    ) => void;
    purge: (element: HTMLElement) => void;
    relayout: (element: HTMLElement, update: any) => void;
  };
  export default Plotly;
} 