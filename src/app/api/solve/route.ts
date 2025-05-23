import { NextResponse } from 'next/server';
import * as math from 'mathjs';

interface WolframPod {
  title: string;
  subpods: Array<{
    plaintext: string;
    img?: {
      src: string;
      alt: string;
      width: number;
      height: number;
    };
  }>;
}

interface WolframResponse {
  queryresult: {
    success: boolean;
    error?: boolean;
    pods?: WolframPod[];
  };
}

// Helper function to generate plot data from solution
function generatePlotData(solution: string, xRange: number[] = [-10, 10]) {
  const x: number[] = [];
  const y: (number | null)[] = [];
  const step = 0.1;

  try {
    console.log('Generating plot data for solution:', solution);

    // Try different patterns to extract the function
    let functionStr = solution;
    
    // Pattern 1: y(x) = expression
    const yxPattern = /y\(x\)\s*=\s*([^+]+)/;
    // Pattern 2: y = expression
    const yPattern = /y\s*=\s*([^+]+)/;
    // Pattern 3: expression (if it contains x)
    const expressionPattern = /([^=]+)$/;

    const yxMatch = solution.match(yxPattern);
    const yMatch = solution.match(yPattern);
    const exprMatch = solution.match(expressionPattern);

    if (yxMatch) {
      functionStr = yxMatch[1].trim();
      console.log('Matched y(x) pattern:', functionStr);
    } else if (yMatch) {
      functionStr = yMatch[1].trim();
      console.log('Matched y pattern:', functionStr);
    } else if (exprMatch && exprMatch[1].includes('x')) {
      functionStr = exprMatch[1].trim();
      console.log('Matched expression pattern:', functionStr);
    } else {
      console.log('No pattern matched, using full solution:', functionStr);
    }

    // Handle constants (c_1, c1, C, etc.)
    const constantPattern = /c_?(\d+)?/g;
    const hasConstants = constantPattern.test(functionStr);
    
    // Replace constants with a specific value (1) for plotting
    functionStr = functionStr.replace(constantPattern, '1');
    console.log('After replacing constants:', functionStr);

    // Simplify the expression using mathjs
    try {
      // First, convert the expression to a format mathjs can understand
      let mathjsExpr = functionStr
        // Handle exponential functions first
        .replace(/e\^\(([^)]+)\)/g, 'exp($1)')  // Handle e^(expression)
        .replace(/e\^([^()]+)/g, 'exp($1)')     // Handle e^expression
        // Handle other operations
        .replace(/\^/g, '**')                    // Replace ^ with **
        .replace(/(\d+)x/g, '$1*x')             // Handle implicit multiplication
        .replace(/x(\d+)/g, 'x*$1')
        .replace(/(\d+)\s*(exp|sin|cos|tan|log|sqrt)/g, '$1*$2')  // Add multiplication between number and function
        .replace(/\)\s*\(/g, ')*(')             // Add multiplication between parentheses
        .trim();

      // Ensure all parentheses are balanced
      const openParens = (mathjsExpr.match(/\(/g) || []).length;
      const closeParens = (mathjsExpr.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        mathjsExpr += ')'.repeat(openParens - closeParens);
      }

      console.log('Initial mathjs expression:', mathjsExpr);

      // Parse and compile the expression
      const node = math.parse(mathjsExpr);
      const compiledFn = node.compile();
      
      console.log('Compiled expression:', node.toString());

      // Test the function with a few values
      const testValues = [-2, -1, 0, 1, 2];
      const testResults = testValues.map(x => {
        try {
          const y = compiledFn.evaluate({ x });
          return { x, y, valid: typeof y === 'number' && isFinite(y) };
        } catch (e) {
          console.log(`Error evaluating test value x=${x}:`, e);
          return { x, y: null, valid: false };
        }
      });
      console.log('Test values:', testResults);

      // If all test values failed, throw an error
      if (testResults.every(r => !r.valid)) {
        throw new Error('Function evaluation failed for all test values');
      }

      // Generate points
      let validPointsCount = 0;
      for (let i = xRange[0]; i <= xRange[1]; i += step) {
        x.push(i);
        try {
          const yValue = compiledFn.evaluate({ x: i });
          if (typeof yValue === 'number' && isFinite(yValue)) {
            y.push(yValue);
            validPointsCount++;
          } else {
            console.log(`Invalid y value at x=${i}:`, yValue);
            y.push(null);
          }
        } catch (e) {
          console.log(`Error evaluating at x=${i}:`, e);
          y.push(null);
        }
      }

      console.log(`Generated ${validPointsCount} valid points out of ${x.length} total points`);

      // Filter out points where both x and y are valid
      const validPoints = x.map((xi, i) => ({ x: xi, y: y[i] }))
        .filter(point => point.y !== null);

      if (validPoints.length === 0) {
        console.error('No valid points generated for the plot');
        return null;
      }

      // Calculate y-axis range based on valid points
      const yValues = validPoints.map(p => p.y as number);
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);
      const yRange = yMax - yMin;
      const yPadding = yRange * 0.1; // Add 10% padding

      console.log('First few valid points:', validPoints.slice(0, 5));
      console.log('Last few valid points:', validPoints.slice(-5));

      const plotData = {
        data: [{
          x: validPoints.map(p => p.x),
          y: validPoints.map(p => p.y),
          type: 'scatter',
          mode: 'lines',
          name: 'Solution',
          line: {
            color: '#1f77b4',
            width: 2
          }
        }],
        layout: {
          title: {
            text: hasConstants ? 'Solution Plot (c₁ = 1)' : 'Solution Plot',
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
            zerolinewidth: 2,
            range: xRange
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
            zerolinewidth: 2,
            range: [yMin - yPadding, yMax + yPadding]
          },
          plot_bgcolor: '#ffffff',
          paper_bgcolor: '#ffffff',
          showlegend: true,
          legend: {
            x: 0,
            y: 1
          },
          margin: {
            l: 50,
            r: 50,
            t: 50,
            b: 50
          }
        }
      };

      console.log('Generated plot data:', JSON.stringify(plotData, null, 2));
      return plotData;
    } catch (e) {
      console.error('Error processing function:', e);
      throw e;
    }
  } catch (e) {
    console.error('Failed to generate plot:', e);
    return null;
  }
}

// Helper function to find solution in Wolfram Alpha pods
function findSolutionInPods(pods: WolframPod[]): string | null {
  // Log all available pods for debugging
  console.log('Available pods:', pods.map(pod => pod.title));

  // Try different possible pod titles that might contain the solution
  const possibleTitles = [
    'Solution',
    'Differential equation solution',
    'General solution',
    'Exact solution',
    'Solution to the differential equation',
    'Indefinite integral',
    'Integral',
    'Result'
  ];

  for (const pod of pods) {
    if (possibleTitles.includes(pod.title) && pod.subpods?.[0]?.plaintext) {
      return pod.subpods[0].plaintext;
    }
  }

  // If no solution found in pods, try to find any pod with a solution-like structure
  for (const pod of pods) {
    if (pod.subpods?.[0]?.plaintext) {
      const text = pod.subpods[0].plaintext;
      // Look for patterns that indicate a solution
      if (text.includes('y =') || text.includes('y(x) =') || text.includes('=')) {
        return text;
      }
    }
  }

  return null;
}

// Helper function to find plot in Wolfram Alpha pods
function findPlotInPods(pods: WolframPod[]): { url: string; alt: string } | null {
  // Try to find a plot in the pods, preferring particular solutions over slope fields
  const plotPods = pods.filter(pod => 
    pod.title === 'Plots of the solution' || 
    pod.title === 'Plots of sample individual solution' || 
    pod.title === 'Sample solution family' ||
    pod.title === 'Slope field'
  );

  // First try to find a particular solution plot (with initial condition)
  const particularSolution = plotPods.find(pod => 
    (pod.title === 'Plots of the solution' || pod.title === 'Plots of sample individual solution') && 
    pod.subpods?.[0]?.img?.src
  );

  if (particularSolution?.subpods?.[0]?.img) {
    return {
      url: particularSolution.subpods[0].img.src,
      alt: particularSolution.subpods[0].img.alt || particularSolution.title
    };
  }

  // If no particular solution, try to find a solution family plot
  const solutionFamily = plotPods.find(pod => 
    pod.title === 'Sample solution family' && 
    pod.subpods?.[0]?.img?.src
  );

  if (solutionFamily?.subpods?.[0]?.img) {
    return {
      url: solutionFamily.subpods[0].img.src,
      alt: solutionFamily.subpods[0].img.alt || solutionFamily.title
    };
  }

  // Finally, fall back to slope field if nothing else is available
  const slopeField = plotPods.find(pod => 
    pod.title === 'Slope field' && 
    pod.subpods?.[0]?.img?.src
  );

  if (slopeField?.subpods?.[0]?.img) {
    return {
      url: slopeField.subpods[0].img.src,
      alt: slopeField.subpods[0].img.alt || slopeField.title
    };
  }

  return null;
}

export async function POST(request: Request) {
  try {
    console.log('Received request to /api/solve');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { equation, initialCondition } = body;

    if (!equation) {
      console.log('No se proporcionó ecuación en la solicitud');
      return NextResponse.json(
        { error: 'La ecuación es requerida' },
        { status: 400 }
      );
    }

    console.log('Procesando ecuación:', equation);
    if (initialCondition) {
      console.log('Con condición inicial:', initialCondition);
    }

    const apiKey = process.env.WOLFRAM_ALPHA_API_KEY;
    console.log('Clave API presente:', !!apiKey);
    if (!apiKey) {
      console.log('No se encontró la clave API de Wolfram Alpha en las variables de entorno');
      console.log('Variables de entorno disponibles:', Object.keys(process.env).filter(key => !key.includes('KEY')));
      throw new Error('La clave API de Wolfram Alpha no está configurada. Por favor, verifica tus variables de entorno.');
    }

    // Format the query for Wolfram Alpha
    let queries: string[];
    if (initialCondition) {
      queries = [
        `solve ${equation} with ${initialCondition}`,
        `solve differential equation ${equation} with ${initialCondition}`,
        `solve ${equation} for y with ${initialCondition}`
      ];
    } else {
      queries = [
        `solve ${equation}`,
        `solve differential equation ${equation}`,
        `solve ${equation} for y`
      ];
    }

    let solution = null;
    let wolframData = null;
    let plotImage = null;

    for (const query of queries) {
      console.log('Intentando consulta:', query);
      const encodedQuery = encodeURIComponent(query);
      const wolframUrl = `https://api.wolframalpha.com/v2/query?input=${encodedQuery}&output=json&appid=${apiKey}`;
      
      const response = await fetch(wolframUrl);
      const data = await response.json() as WolframResponse;
      
      console.log('Respuesta de Wolfram Alpha para la consulta:', query);
      console.log('Datos de respuesta:', JSON.stringify(data, null, 2));

      if (data.queryresult?.success) {
        wolframData = data;
        if (!data.queryresult.pods) {
          console.log('No se encontraron pods en la respuesta de Wolfram Alpha');
          continue;
        }
        solution = findSolutionInPods(data.queryresult.pods);
        plotImage = findPlotInPods(data.queryresult.pods);
        if (solution) {
          console.log('Solución encontrada:', solution);
          break;
        }
      }
    }

    if (!solution) {
      console.error('No se encontró solución en ninguna respuesta de Wolfram Alpha');
      if (wolframData) {
        console.error('Datos de respuesta de Wolfram Alpha:', JSON.stringify(wolframData, null, 2));
      }
      throw new Error('No se pudo encontrar una solución para esta ecuación. Por favor, intenta con un formato diferente o una ecuación más simple.');
    }

    console.log('Enviando respuesta con solución y gráfica');
    return NextResponse.json({
      solution,
      plotImage: plotImage ? {
        url: plotImage.url,
        alt: plotImage.alt
      } : null
    });
  } catch (error) {
    console.error('Error al consultar Wolfram Alpha:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al consultar Wolfram Alpha' },
      { status: 500 }
    );
  }
} 