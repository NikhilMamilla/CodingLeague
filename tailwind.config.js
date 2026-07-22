/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Backgrounds
        'midnight': '#050816',
        'navy': '#0B1120',
        'card-dark': '#111827',
        
        // Accent Colors
        'neon-cyan': '#00E5FF',
        'electric-blue': '#3B82F6',
        
        // Status Colors
        'success': '#22C55E',
        'warning': '#FACC15',
        
        // Prize Colors
        'gold': '#F4C430',
        'silver': '#C0C0C0',
        'bronze': '#CD7F32',
        
        // Text Colors
        'text-primary': '#FFFFFF',
        'text-secondary': '#CBD5E1',
      },
      fontFamily: {
        'heading': ['Orbitron', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'numbers': ['Rajdhani', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00E5FF, 0 0 10px #00E5FF' },
          '100%': { boxShadow: '0 0 10px #00E5FF, 0 0 20px #00E5FF, 0 0 30px #00E5FF' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}