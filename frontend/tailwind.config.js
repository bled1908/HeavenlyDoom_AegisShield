/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#edf5ff',
          100: '#d6e9ff',
          200: '#b5d6ff',
          300: '#85baff',
          400: '#4d93ff',
          500: '#246bff',
          600: '#0a4df5',
          700: '#0838e2',
          800: '#0d2fb7',
          900: '#112c90',
        },
        aegis: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        dark: {
          900: '#0a0f1e',
          800: '#0d1526',
          700: '#111c35',
          600: '#162044',
          500: '#1e2d5a',
        },
        glass: 'rgba(255, 255, 255, 0.05)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #246bff 0%, #0a4df5 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0a0f1e 0%, #162044 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(36,107,255,0.1) 0%, rgba(10,77,245,0.05) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 30px rgba(36, 107, 255, 0.3)',
        'glow-green': '0 0 30px rgba(34, 197, 94, 0.3)',
      },
    },
  },
  plugins: [],
};
