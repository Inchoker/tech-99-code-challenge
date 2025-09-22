# Currency Swap Application

A React-based currency exchange application built with TypeScript, Vite, and Tailwind CSS. This application allows users to swap between different currencies with real-time exchange rates.

## Features

- 🔄 Currency pair selection
- 💱 Real-time exchange rate calculation
- 📱 Responsive design with Tailwind CSS
- ⚡ Fast development with Vite
- 🎯 TypeScript for type safety
- 🔧 ESLint for code quality

## Tech Stack

- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **React Select** - Dropdown component library

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Navigate to the problem2 directory:
   ```bash
   cd src/problem2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Usage Walkthrough

### Step 1. Choose the constraints

![img.png](imgs/img.png)

### Step 2. Click swap, app is loading

![img_1.png](imgs/img_1.png)

### Step 3. Happy case

![img_2.png](imgs/img_2.png)

### Unhappy case 

![img_3.png](imgs/img_3.png)

## Project Structure

```
src/
├── components/
│   ├── SwapForm.tsx      # Main swap form component
│   └── TokenSelector.tsx # Currency selection component
├── services/
│   └── api.ts           # API service for exchange rates
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Contributing

1. Follow the existing code style
2. Run linting before committing: `npm run lint`
3. Ensure TypeScript compilation passes: `npm run build`

