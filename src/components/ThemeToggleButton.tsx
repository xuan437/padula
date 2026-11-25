import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from './Icons';

export default function ThemeToggleButton({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('padula_theme');
        if (saved === 'light' || saved === 'dark') return saved;
      } catch {}
      const attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'light' || attr === 'dark') return attr;
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('padula_theme', theme);
    } catch {}
  }, [theme]);

  const toggle = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-sm btn-ghost theme-toggle-btn"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: compact ? '6px 8px' : '6px 12px',
        fontSize: '12px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
      {!compact && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
