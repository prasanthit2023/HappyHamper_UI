/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,css}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary warm brown / sandal palette
        primary: {
          50:  '#FAF7F4',
          100: '#F0E6D8',
          200: '#E0CCBA',
          300: '#CDB09C',
          400: '#C4956A',
          500: '#A67C52',
          600: '#8B6340',
          700: '#7A5A3A',
          800: '#5C4229',
          900: '#3D2C1A',
          950: '#1E160D',
        },
        // Secondary soft beige
        sandal: {
          50:  '#FAF8F5',
          100: '#F5EEE6',
          200: '#EDE0D0',
          300: '#E8D9C5',
          400: '#DEC9AF',
          500: '#D0B896',
          600: '#BEA07A',
          700: '#A67C52',
          800: '#7A5A3A',
          900: '#4D3820',
        },
        // Neutral warm tones
        neutral: {
          50:  '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'product':  '0 4px 20px rgba(166, 124, 82, 0.18)',
        'card':     '0 2px 15px rgba(0, 0, 0, 0.06)',
        'drawer':   '-5px 0 30px rgba(0, 0, 0, 0.12)',
        'navbar':   '0 2px 20px rgba(166, 124, 82, 0.10)',
        'float':    '0 10px 40px rgba(0, 0, 0, 0.10)',
        'warm':     '0 4px 24px rgba(166, 124, 82, 0.20)',
      },
      animation: {
        'fade-in':        'fadeIn 0.35s ease-in-out',
        'slide-up':       'slideUp 0.4s ease-out',
        'slide-down':     'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left':  'slideInLeft 0.3s ease-out',
        'scale-in':       'scaleIn 0.2s ease-out',
        'shimmer':        'shimmer 1.5s infinite',
        'bounce-soft':    'bounceSoft 2s ease-in-out infinite',
        'counter-up':     'counterUp 0.8s ease-out forwards',
        'lift':           'lift 0.25s ease-out forwards',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown:    { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(30px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideInLeft:  { from: { opacity: '0', transform: 'translateX(-30px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:      { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        counterUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        lift: {
          from: { transform: 'translateY(0)' },
          to:   { transform: 'translateY(-4px)' },
        },
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero':    'linear-gradient(135deg, #FAF8F5 0%, #F5EEE6 100%)',
        'gradient-card':    'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.55) 100%)',
        'shimmer-warm':     'linear-gradient(90deg, #F5EEE6 25%, #E8D9C5 50%, #F5EEE6 75%)',
        'gradient-sandal':  'linear-gradient(135deg, #A67C52 0%, #C4956A 100%)',
        'gradient-hero-full': 'linear-gradient(135deg, #FAF8F5 0%, #F5EEE6 50%, #FAF7F4 100%)',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth':    'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
