import type { Config } from 'tailwindcss';

const token = (name: string) => `oklch(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    fontSize: {
      '3xs': '9px',
      '2xs': '10px',
      xs: '11px',
      sm: '12px',
      base: '13px',
      md: '14px',
      lg: '15px',
    },
    extend: {
      colors: {
        cmd: {
          bg: token('cmd-bg'),
          surface: token('cmd-surface'),
          raised: token('cmd-raised'),
          hover: token('cmd-hover'),
          sel: token('cmd-sel'),
          line: token('cmd-line'),
          'line-strong': token('cmd-line-strong'),
          fg: token('cmd-fg'),
          'fg-dim': token('cmd-fg-dim'),
          'fg-mute': token('cmd-fg-mute'),
          accent: token('cmd-accent'),
          'accent-dim': token('cmd-accent-dim'),
          'fail-wash': token('cmd-fail-wash'),
        },
        run: {
          created: token('run-created'),
          pending: token('run-pending'),
          running: token('run-running'),
          waiting: token('run-waiting'),
          success: token('run-success'),
          failed: token('run-failed'),
          killed: token('run-killed'),
          skipped: token('run-skipped'),
        },
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          'SF Pro Display',
          '-apple-system',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Open Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: ['Berkeley Mono', 'JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        micro: '2px',
        card: '8px',
        panel: '12px',
      },
      boxShadow: {
        elevated: 'rgba(0,0,0,0.4) 0px 2px 4px',
      },
      keyframes: {
        'live-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.85)' },
        },
        'node-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 oklch(var(--cmd-accent) / 0.55)' },
          '50%': { boxShadow: '0 0 0 4px oklch(var(--cmd-accent) / 0)' },
        },
        'log-fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'live-pulse': 'live-pulse 1.6s ease-in-out infinite',
        'node-pulse': 'node-pulse 2s ease-out infinite',
        'log-fade-in': 'log-fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
