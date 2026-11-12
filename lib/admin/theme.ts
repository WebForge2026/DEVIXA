import { defaultTheme, type ThemeSettings } from './types';

const hexToRgb = (hex: string) => {
  const value = /^#([0-9a-f]{6})$/i.exec(hex)?.[1] ?? 'FF2A2A';
  const n = parseInt(value, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

const clamp = (v: number, min: number, max: number, fallback: number) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback);

/** Admin design settings → CSS custom properties on :root. Defaults equal the original hard-coded look. */
export const themeStyle = (theme: Partial<ThemeSettings> | undefined) => {
  const t = { ...defaultTheme, ...theme };
  const radius = clamp(t.cardRadius, 0, 24, 0);
  const glow = clamp(t.glow, 0, 0.4, defaultTheme.glow);
  const sphereRed = clamp(t.sphereRed, 0.05, 0.45, defaultTheme.sphereRed);
  return {
    css: `:root{--accent-rgb:${hexToRgb(t.accent)};--card-radius:${radius}px;--glow-alpha:${glow}}`,
    sphereRed: String(sphereRed),
  };
};
