import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        slate: { stone: '#E2E4E9', deep: '#CBD5E1' },
        obsidian: '#050507',
        crimson: { DEFAULT: '#FF2A2A', deep: '#990000' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { crushed: '-0.055em' },
      keyframes: {
        beam: { to: { offsetDistance: '100%' } },
        marquee: { to: { transform: 'translateX(-50%)' } },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.25' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
      },
      animation: {
        beam: 'beam 6s linear infinite',
        marquee: 'marquee 40s linear infinite',
        blink: 'blink 1.6s steps(2) infinite',
        scan: 'scan 3.5s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
