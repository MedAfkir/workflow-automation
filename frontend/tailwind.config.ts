import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          marketing: '#08090a',
          panel: '#0f1011',
          surface: '#191a1b',
          secondary: '#28282c'
        },
        fg: {
          primary: '#f7f8f8',
          secondary: '#d0d6e0',
          tertiary: '#8a8f98',
          quaternary: '#62666d'
        },
        brand: {
          indigo: '#5e6ad2',
          violet: '#7170ff',
          'violet-hover': '#828fff',
          lavender: '#7a7fad'
        },
        status: {
          pending: '#62666d',
          running: '#3b82f6',
          waiting: '#f59e0b',
          success: '#27a644',
          'success-alt': '#10b981',
          failed: '#dc2626',
          skipped: '#62666d'
        },
        border: {
          primary: '#23252a',
          secondary: '#34343a',
          tertiary: '#3e3e44',
          'line-tint': '#141516',
          'line-tertiary': '#18191a'
        },
        cmd: {
          bg: 'oklch(0.165 0.006 195)',
          surface: 'oklch(0.205 0.007 195)',
          raised: 'oklch(0.245 0.008 195)',
          hover: 'oklch(0.275 0.010 195)',
          sel: 'oklch(0.305 0.045 195)',
          line: 'oklch(0.305 0.010 195)',
          'line-strong': 'oklch(0.400 0.012 195)',
          fg: 'oklch(0.955 0.006 195)',
          'fg-dim': 'oklch(0.790 0.011 195)',
          'fg-mute': 'oklch(0.635 0.013 195)',
          accent: 'oklch(0.780 0.125 195)',
          'accent-dim': 'oklch(0.560 0.100 195)',
          'fail-wash': 'oklch(0.210 0.030 25)'
        },
        run: {
          created: 'oklch(0.700 0.018 195)',
          pending: 'oklch(0.700 0.018 195)',
          running: 'oklch(0.720 0.120 235)',
          waiting: 'oklch(0.780 0.120 75)',
          success: 'oklch(0.740 0.130 150)',
          failed: 'oklch(0.660 0.180 25)',
          killed: 'oklch(0.640 0.100 40)',
          skipped: 'oklch(0.550 0.010 195)'
        }
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'SF Pro Display', '-apple-system', 'system-ui', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
        mono: ['Berkeley Mono', 'JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace']
      },
      fontWeight: {
        signature: '510',
        announce: '590'
      },
      letterSpacing: {
        'display-xl': '-1.584px',
        'display-lg': '-1.408px',
        display: '-1.056px',
        'heading-1': '-0.704px',
        'heading-2': '-0.288px',
        'heading-3': '-0.24px',
        'body-large': '-0.165px',
        small: '-0.165px',
        caption: '-0.13px'
      },
      borderRadius: {
        micro: '2px',
        comfortable: '6px',
        card: '8px',
        panel: '12px',
        large: '22px'
      },
      boxShadow: {
        ring: 'rgba(0,0,0,0.2) 0px 0px 0px 1px',
        elevated: 'rgba(0,0,0,0.4) 0px 2px 4px',
        focus: 'rgba(0,0,0,0.1) 0px 4px 12px',
        dialog: 'rgba(0,0,0,0) 0px 8px 2px, rgba(0,0,0,0.01) 0px 5px 2px, rgba(0,0,0,0.04) 0px 3px 2px, rgba(0,0,0,0.07) 0px 1px 1px, rgba(0,0,0,0.08) 0px 0px 1px',
        sunken: 'rgba(0,0,0,0.2) 0px 0px 12px 0px inset'
      },
      keyframes: {
        'live-pulse': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)'
          },
          '50%': {
            opacity: '0.6',
            transform: 'scale(0.85)'
          }
        },
        'node-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 oklch(0.78 0.125 195 / 0.55)'
          },
          '50%': {
            boxShadow: '0 0 0 4px oklch(0.78 0.125 195 / 0)'
          }
        },
        'edge-dot': {
          '0%': {
            offsetDistance: '0%'
          },
          '100%': {
            offsetDistance: '100%'
          }
        },
        'log-fade-in': {
          from: {
            opacity: '0',
            transform: 'translateY(4px)'
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)'
          }
        }
      },
      animation: {
        'live-pulse': 'live-pulse 1.6s ease-in-out infinite',
        'node-pulse': 'node-pulse 2s ease-out infinite',
        'log-fade-in': 'log-fade-in 200ms ease-out'
      }
    }
  },
  plugins: []
};
export default config;
