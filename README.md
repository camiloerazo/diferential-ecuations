# Differential Equation Solver

A web application that solves differential equations using Wolfram Alpha API and visualizes the solutions with interactive plots.

## Features

- Solve various types of differential equations
- Interactive solution plots using Plotly.js
- Real-time equation solving
- Support for first and second-order differential equations
- Clean and modern UI

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Wolfram Alpha API
- Plotly.js
- Math.js

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/camiloerazo/diferential-ecuations.git
cd diferential-ecuations
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your Wolfram Alpha API key:
```
WOLFRAM_ALPHA_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

Enter your differential equation in the input field. Examples:
- `dy/dx = x^2`
- `dy/dx = sin(x)`
- `d²y/dx² + dy/dx + y = 0`

Make sure to:
- Use proper mathematical notation
- Include spaces around the equals sign
- Use proper superscript notation (², ³) for higher-order derivatives

## Deployment

This project can be easily deployed to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcamiloerazo%2Fdiferential-ecuations)

## License

MIT

## Author

Juan Camilo Erazo
