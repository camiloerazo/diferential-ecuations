# 🧮 Advanced Differential Equation Solver

A powerful, full-stack web application for solving and visualizing differential equations in real-time. Built with modern web technologies and mathematical computation capabilities.

![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)
![React](https://img.shields.io/badge/React-19.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC)
![Wolfram Alpha](https://img.shields.io/badge/Wolfram%20Alpha-API-orange)

## 🌟 Key Features

### Mathematical Capabilities
- **Advanced Equation Solving**
  - First and second-order differential equations
  - Support for complex mathematical expressions
  - Real-time equation validation and parsing
  - Mathematical notation rendering using MathJax

### Visualization & Interactivity
- **Dynamic Plotting**
  - Interactive 2D plots using Plotly.js
  - Real-time solution visualization
  - Customizable plot parameters
  - Zoom, pan, and export capabilities
  - Multiple solution curves support

### User Experience
- **Modern Interface**
  - Clean, responsive design
  - Intuitive equation input
  - Real-time feedback
  - Error handling and validation
  - Dark/Light mode support

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.3.2 (React 19)
  - Server-side rendering (SSR)
  - Static site generation (SSG)
  - API routes
  - Turbopack for fast development
- **Language**: TypeScript 5.0
- **Styling**: TailwindCSS 4.0
- **State Management**: React Hooks
- **Build Tools**: 
  - ESLint 9.0
  - PostCSS
  - TypeScript Compiler

### Mathematical & Visualization
- **Computation**: 
  - Wolfram Alpha API
  - Math.js for client-side calculations
- **Visualization**: 
  - Plotly.js for interactive plots
  - MathJax for mathematical notation

### Development & Quality
- **Code Quality**:
  - ESLint for code linting
  - TypeScript for type safety
  - Strict mode enabled
- **Performance**:
  - Optimized bundle size
  - Code splitting
  - Image optimization
  - Fast refresh

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- Wolfram Alpha API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/camiloerazo/diferential-ecuations.git
cd diferential-ecuations
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
WOLFRAM_ALPHA_API_KEY=your_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Development**
```bash
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000)

5. **Production Build**
```bash
npm run build
npm start
```

## 📝 Usage Guide

### Equation Input Format
- Use standard mathematical notation
- Examples:
  ```
  dy/dx = x^2 + 2x + 1
  d²y/dx² + 2dy/dx + y = sin(x)
  y' = e^x * cos(x)
  ```

### Best Practices
- Include spaces around operators
- Use proper superscript notation (², ³)
- Specify initial conditions when needed
- Use parentheses for complex expressions

## 🚀 Deployment

### Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcamiloerazo%2Fdiferential-ecuations)

### Other Platforms
The application can be deployed to any platform supporting Node.js applications:
- AWS
- Google Cloud Platform
- Digital Ocean
- Heroku

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Juan Camilo Erazo**
- GitHub: [@camiloerazo](https://github.com/camiloerazo)

## 🙏 Acknowledgments

- Wolfram Alpha for their powerful computational API
- The Next.js team for the amazing framework
- The open-source community for the incredible tools and libraries

---

⭐ Star this repository if you find it useful!!
