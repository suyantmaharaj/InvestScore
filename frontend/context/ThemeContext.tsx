'use client';

// Re-export from lib/theme so existing imports still work.
// Components that imported useTheme from here get { theme, toggleTheme }.
// SMESideNav was the main consumer; it now uses ThemeToggle directly.
export { ThemeProvider, useTheme } from '@/lib/theme';
