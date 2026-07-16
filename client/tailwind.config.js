module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      boxShadow: {
        glass: '0 20px 50px rgba(0, 0, 0, 0.15)'
      },
      colors: {
        backdrop: '#0f172a'
      }
    }
  },
  plugins: []
};
