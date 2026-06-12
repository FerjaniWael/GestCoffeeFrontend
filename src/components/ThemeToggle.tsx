'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: 'var(--primary-light)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '34px',
        height: '34px',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        flexShrink: 0,
      }}
    >
      {theme === 'dark'
        ? <Sun style={{ width: '15px', height: '15px' }} />
        : <Moon style={{ width: '15px', height: '15px' }} />
      }
    </button>
  );
}
