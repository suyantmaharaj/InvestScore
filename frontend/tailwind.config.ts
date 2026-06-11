// Tailwind v4 - most configuration lives in globals.css via @theme
// This file registers plugins only; colors/fonts are defined in CSS.
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'] as const,
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  plugins: [],
};

export default config;
