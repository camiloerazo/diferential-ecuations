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
    numpods?: number;
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
async function findPlotInPods(pods: WolframPod[]): Promise<{ url: string; alt: string } | null> {
  console.log('Searching for plots in pods. Available pods:', pods.map(pod => ({
    title: pod.title,
    hasImage: pod.subpods?.[0]?.img ? true : false
  })));

  // Try to find a plot in the pods, preferring particular solutions over slope fields
  const plotPods = pods.filter(pod => 
    pod.title === 'Plots of the solution' || 
    pod.title === 'Plots of sample individual solution' || 
    pod.title === 'Sample solution family' ||
    pod.title === 'Slope field' ||
    pod.title === 'Plot' ||  // Add more possible plot titles
    pod.title === 'Solution plot' ||
    pod.title === 'Solution curves'
  );

  console.log('Found potential plot pods:', plotPods.map(pod => pod.title));

  // First try to find a particular solution plot (with initial condition)
  const particularSolution = plotPods.find(pod => 
    (pod.title === 'Plots of the solution' || 
     pod.title === 'Plots of sample individual solution' ||
     pod.title === 'Plot' ||
     pod.title === 'Solution plot') && 
    pod.subpods?.[0]?.img?.src
  );

  if (particularSolution?.subpods?.[0]?.img) {
    console.log('Found particular solution plot:', particularSolution.title);
    try {
      console.log('Fetching image from:', particularSolution.subpods[0].img.src);
      const response = await fetch(particularSolution.subpods[0].img.src);
      if (!response.ok) {
        console.error('Failed to fetch image:', response.status, response.statusText);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      console.log('Successfully converted image to base64');
      return {
        url: `data:image/png;base64,${base64}`,
        alt: particularSolution.subpods[0].img.alt || particularSolution.title
      };
    } catch (error) {
      console.error('Error fetching plot image:', error);
      return null;
    }
  }

  // If no particular solution, try to find a solution family plot
  const solutionFamily = plotPods.find(pod => 
    (pod.title === 'Sample solution family' || 
     pod.title === 'Solution curves') && 
    pod.subpods?.[0]?.img?.src
  );

  if (solutionFamily?.subpods?.[0]?.img) {
    console.log('Found solution family plot:', solutionFamily.title);
    try {
      console.log('Fetching image from:', solutionFamily.subpods[0].img.src);
      const response = await fetch(solutionFamily.subpods[0].img.src);
      if (!response.ok) {
        console.error('Failed to fetch image:', response.status, response.statusText);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      console.log('Successfully converted image to base64');
      return {
        url: `data:image/png;base64,${base64}`,
        alt: solutionFamily.subpods[0].img.alt || solutionFamily.title
      };
    } catch (error) {
      console.error('Error fetching plot image:', error);
      return null;
    }
  }

  // Finally, fall back to slope field if nothing else is available
  const slopeField = plotPods.find(pod => 
    pod.title === 'Slope field' && 
    pod.subpods?.[0]?.img?.src
  );

  if (slopeField?.subpods?.[0]?.img) {
    console.log('Found slope field plot:', slopeField.title);
    try {
      console.log('Fetching image from:', slopeField.subpods[0].img.src);
      const response = await fetch(slopeField.subpods[0].img.src);
      if (!response.ok) {
        console.error('Failed to fetch image:', response.status, response.statusText);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      console.log('Successfully converted image to base64');
      return {
        url: `data:image/png;base64,${base64}`,
        alt: slopeField.subpods[0].img.alt || slopeField.title
      };
    } catch (error) {
      console.error('Error fetching plot image:', error);
      return null;
    }
  }

  console.log('No suitable plot found in any of the pods');
  return null;
}

// Helper function to find ODE classification in Wolfram Alpha pods
function findODEClassification(pods: WolframPod[]): string | null {
  const classificationPod = pods.find(pod => pod.title === 'ODE classification');
  if (classificationPod?.subpods?.[0]?.plaintext) {
    return classificationPod.subpods[0].plaintext;
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
    let odeClassification = null;

    for (const query of queries) {
      console.log('Intentando consulta:', query);
      const encodedQuery = encodeURIComponent(query);
      const wolframUrl = `https://api.wolframalpha.com/v2/query?input=${encodedQuery}&output=json&appid=${apiKey}&format=image,plaintext`;
      
      console.log('URL de la consulta:', wolframUrl);
      
      const response = await fetch(wolframUrl);
      const data = await response.json() as WolframResponse;
      
      // Detailed logging of the response
      console.log('=== RESPUESTA DETALLADA DE WOLFRAM ALPHA ===');
      console.log('Query:', query);
      console.log('Success:', data.queryresult?.success);
      console.log('Error:', data.queryresult?.error);
      console.log('Number of pods:', data.queryresult?.numpods);
      console.log('Available pods:', data.queryresult?.pods?.map(pod => ({
        title: pod.title,
        hasImage: pod.subpods?.[0]?.img ? true : false,
        hasPlaintext: pod.subpods?.[0]?.plaintext ? true : false,
        plaintext: pod.subpods?.[0]?.plaintext
      })));
      console.log('Full response:', JSON.stringify(data, null, 2));
      console.log('===========================================');

      if (data.queryresult?.success) {
        wolframData = data;
        if (!data.queryresult.pods) {
          console.log('No se encontraron pods en la respuesta de Wolfram Alpha');
          continue;
        }
        solution = findSolutionInPods(data.queryresult.pods);
        plotImage = await findPlotInPods(data.queryresult.pods);
        odeClassification = findODEClassification(data.queryresult.pods);
        if (solution) {
          console.log('Solución encontrada:', solution);
          if (!plotImage) {
            console.log('No se pudo encontrar una gráfica para la solución');
          }
          break;
        }
      }
    }

    // If we have a solution but no plot, try one more time with a specific plot request
    if (solution && !plotImage) {
      console.log('Intentando obtener gráfica de familia de soluciones');
      const plotQuery = `plot family of solutions for ${equation}`;
      const encodedQuery = encodeURIComponent(plotQuery);
      const wolframUrl = `https://api.wolframalpha.com/v2/query?input=${encodedQuery}&output=json&appid=${apiKey}&format=image,plaintext`;
      
      console.log('URL de la consulta de gráfica:', wolframUrl);
      
      const response = await fetch(wolframUrl);
      const data = await response.json() as WolframResponse;
      
      // Detailed logging for the plot request
      console.log('=== RESPUESTA DETALLADA DE WOLFRAM ALPHA (PLOT) ===');
      console.log('Query:', plotQuery);
      console.log('Success:', data.queryresult?.success);
      console.log('Error:', data.queryresult?.error);
      console.log('Number of pods:', data.queryresult?.numpods);
      console.log('Available pods:', data.queryresult?.pods?.map(pod => ({
        title: pod.title,
        hasImage: pod.subpods?.[0]?.img ? true : false,
        hasPlaintext: pod.subpods?.[0]?.plaintext ? true : false,
        plaintext: pod.subpods?.[0]?.plaintext
      })));
      console.log('Full response:', JSON.stringify(data, null, 2));
      console.log('=================================================');

      if (data.queryresult?.success && data.queryresult.pods) {
        plotImage = await findPlotInPods(data.queryresult.pods);
        if (plotImage) {
          console.log('Gráfica de familia de soluciones encontrada');
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
      } : null,
      odeClassification
    });
  } catch (error) {
    console.error('Error al consultar Wolfram Alpha:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al consultar Wolfram Alpha' },
      { status: 500 }
    );
  }
} 