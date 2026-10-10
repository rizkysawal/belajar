/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e0ecff',
          200: '#c7dcfe',
          300: '#a2c4fd',
          400: '#75a2fa',
          500: '#487bf5',
          600: '#2b58ea',
          700: '#2043d6',
          800: '#2039ad',
          900: '#1e3388',
        },
        child: {
          yellow: '#FFDE59',
          orange: '#FF914D',
          pink: '#FF66C4',
          blue: '#5CE1E6',
          purple: '#C175FF',
          green: '#7ED957'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        comic: ['Fredoka', 'Quicksand', 'Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'bounce-subtle': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
