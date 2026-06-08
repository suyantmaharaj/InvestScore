'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white/10"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun  size={16} style={{ color: '#00B5ED' }} />
      ) : (
        <Moon size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
      )}
      {!compact && (
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </span>
      )}
    </button>
  );
}
