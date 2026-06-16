/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,css}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary periwinkle bluebell palette
        primary: {
          50:  '#F5F6FC',
          100: '#EAEBFA',
          200: '#D4D7F5',
          300: '#B4B9EC',
          400: '#8E95DF',
          500: '#7C83C3',
          600: '#5B61A1',
          700: '#494E83',
          800: '#393D64',
          900: '#262943',
          950: '#131421',
        },
        // Secondary soft beige / sandal / taupe
        sandal: {
          50:  '#FAF8F5',
          100: '#F5EEE6',
          200: '#EDE0D0',
          300: '#E8D9C5',
          400: '#DEC9AF',
          500: '#D0B896',
          600: '#A0958B',
          700: '#877B73',
          800: '#6E625A',
          900: '#4D443F',
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
        'product':  '0 4px 20px rgba(124, 131, 195, 0.12)',
        'card':     '0 2px 15px rgba(0, 0, 0, 0.03)',
        'drawer':   '-5px 0 30px rgba(0, 0, 0, 0.08)',
        'navbar':   '0 2px 20px rgba(124, 131, 195, 0.06)',
        'float':    '0 10px 40px rgba(0, 0, 0, 0.06)',
        'warm':     '0 4px 24px rgba(124, 131, 195, 0.15)',
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
        'gradient-hero':    'linear-gradient(135deg, #FDFBF7 0%, #FAF6EE 100%)',
        'gradient-card':    'linear-gradient(180deg, transparent 60%, rgba(62,57,53,0.55) 100%)',
        'shimmer-warm':     'linear-gradient(90deg, #FAF6EE 25%, #EBE6DF 50%, #FAF6EE 75%)',
        'gradient-sandal':  'linear-gradient(135deg, #7C83C3 0%, #9B9FD2 100%)',
        'gradient-hero-full': 'linear-gradient(135deg, #FDFBF7 0%, #F0F1FA 50%, #FAF6EE 100%)',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth':    'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
