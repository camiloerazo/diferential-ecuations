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
      } catch (e) {
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
        title: 'Solution Plot',
        xaxis: { title: 'x' },
        yaxis: { title: 'y' },
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
      console.log('No equation provided in request');
      return NextResponse.json(
        { error: 'Equation is required' },
        { status: 400 }
      );
    }

    console.log('Processing equation:', equation);

    const apiKey = process.env.WOLFRAM_ALPHA_API_KEY;
    if (!apiKey) {
      console.log('Wolfram Alpha API key not found in environment variables');
      throw new Error('Wolfram Alpha API key not configured');
    }

    // Format the query for Wolfram Alpha
    // Try different query formats to increase chances of getting a solution
    const queries = [
      `solve ${equation}`,
      `solve differential equation ${equation}`,
      `solve ${equation} for y`
    ];

    let solution = null;
    let wolframData = null;

    // Try each query format until we get a solution
    for (const query of queries) {
      console.log('Trying query:', query);
      const encodedQuery = encodeURIComponent(query);
      const wolframUrl = `https://api.wolframalpha.com/v2/query?input=${encodedQuery}&output=json&appid=${apiKey}`;
      
      const response = await fetch(wolframUrl);
      const data = await response.json() as WolframResponse;
      
      console.log('Wolfram Alpha response for query:', query);
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (data.queryresult?.success) {
        wolframData = data;
        // Add null check for pods
        if (!data.queryresult.pods) {
          console.log('No pods found in Wolfram Alpha response');
          return NextResponse.json(
            { error: 'Could not find solution in Wolfram Alpha response' },
            { status: 400 }
          );
        }
        solution = findSolutionInPods(data.queryresult.pods);
        if (solution) {
          console.log('Found solution:', solution);
          break;
        }
      }
    }

    if (!solution) {
      console.error('No solution found in any Wolfram Alpha response');
      // If we have the Wolfram data, include it in the error for debugging
      if (wolframData) {
        console.error('Wolfram Alpha response data:', JSON.stringify(wolframData, null, 2));
      }
      throw new Error('Could not find a solution for this equation. Please try a different format or a simpler equation.');
    }

    const plotData = generatePlotData(solution);
    console.log('Generated plot data');

    return NextResponse.json({
      solution,
      plotData,
    });
  } catch (error) {
    console.error('Error querying Wolfram Alpha:', error);
    return NextResponse.json(
      { error: 'Failed to query Wolfram Alpha' },
      { status: 500 }
    );
  }
} 