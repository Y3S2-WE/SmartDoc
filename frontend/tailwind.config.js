/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#121212',
        lake: '#113f67',
        mint: '#6db8a4',
        sand: '#f7f1e5',
        ember: '#f06b36'
      },
      boxShadow: {
        panel: '0 12px 30px rgba(17, 63, 103, 0.18)'
      }
    }
  },
  plugins: []
};
