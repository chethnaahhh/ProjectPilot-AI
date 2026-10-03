/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbf8',
          100: '#d9f6ef',
          200: '#b4ebdf',
          300: '#7cdbc5',
          400: '#4ec2a9',
          500: '#2da68d',
          600: '#1d876f',
          700: '#1b6e5b',
          800: '#1d594d',
          900: '#1d473f',
        },
        accent: {
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
