import { NextResponse } from 'next/server';
import * as math from 'mathjs';

interface WolframPod {
  title: string;
  subpods: Array<{
    plaintext: string;
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
  const x = [];
  const y = [];
  const step = 0.1;

  try {
    // Try to extract the function part from the solution
    // Example: "y(x) = x^2 + C" -> "x^2"
    const functionMatch = solution.match(/=\s*([^+]+)/);
    const functionStr = functionMatch ? functionMatch[1].trim() : solution;

    // Create a function from the solution
    const solutionFn = math.parse(functionStr).compile();

    // Generate points
    for (let i = xRange[0]; i <= xRange[1]; i += step) {
      x.push(i);
      try {
        const yValue = solutionFn.evaluate({ x: i });
        y.push(yValue);
      } catch {
        y.push(null);
      }
    }

    return {
      data: [{
        x,
        y,
        type: 'scatter',
        mode: 'lines',
        name: 'Solution',
      }],
      layout: {
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
        showlegend: true,
      }
    };
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

export async function POST(request: Request) {
  try {
    console.log('Received request to /api/solve');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { equation } = body;

    if (!equation) {
      console.log('No se proporcionó ecuación en la solicitud');
      return NextResponse.json(
        { error: 'La ecuación es requerida' },
        { status: 400 }
      );
    }

    console.log('Procesando ecuación:', equation);

    const apiKey = process.env.WOLFRAM_ALPHA_API_KEY;
    console.log('Clave API presente:', !!apiKey);
    if (!apiKey) {
      console.log('No se encontró la clave API de Wolfram Alpha en las variables de entorno');
      console.log('Variables de entorno disponibles:', Object.keys(process.env).filter(key => !key.includes('KEY')));
      throw new Error('La clave API de Wolfram Alpha no está configurada. Por favor, verifica tus variables de entorno.');
    }

    // Format the query for Wolfram Alpha
    const queries = [
      `solve ${equation}`,
      `solve differential equation ${equation}`,
      `solve ${equation} for y`
    ];

    let solution = null;
    let wolframData = null;

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
          return NextResponse.json(
            { error: 'No se pudo encontrar la solución en la respuesta de Wolfram Alpha' },
            { status: 400 }
          );
        }
        solution = findSolutionInPods(data.queryresult.pods);
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

    const plotData = generatePlotData(solution);
    console.log('Datos de la gráfica generados');

    return NextResponse.json({
      solution,
      plotData,
    });
  } catch (error) {
    console.error('Error al consultar Wolfram Alpha:', error);
    return NextResponse.json(
      { error: 'Error al consultar Wolfram Alpha' },
      { status: 500 }
    );
  }
} 