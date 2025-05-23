import { NextResponse } from 'next/server';

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