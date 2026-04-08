
// module.exports = {
//   content: ["./src/**/*.{js,jsx,ts,tsx}"],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'gray-650': '#6e7280',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%':       { transform: 'translateY(-20px) translateX(10px)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%':       { transform: 'translateY(-30px) translateX(-15px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px) rotate(0deg)' },
          '50%':       { transform: 'translateY(-15px) translateX(20px) rotate(5deg)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'float':          'float 8s ease-in-out infinite',
        'float-delayed':  'float-delayed 10s ease-in-out infinite 1s',
        'float-slow':     'float-slow 12s ease-in-out infinite 2s',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'fade-in':        'fade-in 0.2s ease-out',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont',
               'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}