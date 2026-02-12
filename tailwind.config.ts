import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#252523',
          secondary: '#252523',
        },
        surface: {
          primary: '#252523',
          secondary: '#30363D',
        },
        border: {
          primary: '#363532',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#C0BEB3',
          tertiary: '#999999',
          placeholder: '#666666',
          disabled: '#555555',
        },
        action: {
          primary: '#E8704E',
          warning: '#E8704E',
          danger: '#E8704E',
          disabled: '#844632',
        },
        accent: {
          primary: '#E8704E',
          secondary: '#0086E3',
        },
        icon: {
          primary: '#0086E3',
          background: '#30363D',
        },
        success: '#34C759',
        gem: '#00A3FF',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'apple-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'apple': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'apple-lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'apple-xl': '0 8px 32px rgba(0, 0, 0, 0.16)',
      },
      borderRadius: {
        'apple': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
export default config
