'use client';

import { Toaster } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';

export function ToasterWrapper() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: theme === 'dark' ? '#1c1613' : '#fffdf8',
          color: theme === 'dark' ? '#fafaf9' : '#1A1208',
          border: `1px solid ${theme === 'dark' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(194, 140, 50, 0.3)'}`,
          fontFamily: 'var(--font-body)',
        },
      }}
    />
  );
}
