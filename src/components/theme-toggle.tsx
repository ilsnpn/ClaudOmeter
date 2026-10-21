'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'system' | 'light' | 'dark';
const KEY = 'theme';

// Runs in <head> before first paint so the page never flashes the wrong theme.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${KEY}')}catch(e){}
var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.classList.toggle('dark',d)})()`;

function apply(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'Système', icon: Monitor },
  { value: 'light', label: 'Jour', icon: Sun },
  { value: 'dark', label: 'Nuit', icon: Moon },
];

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Theme | null;
      // Read after mount so server and client render the same markup.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === 'light' || saved === 'dark' || saved === 'system') setTheme(saved);
    } catch { /* storage unavailable: stay on system */ }
  }, []);

  useEffect(() => {
    apply(theme);
    if (theme !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply(theme);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  function choose(next: Theme) {
    setTheme(next);
    try { localStorage.setItem(KEY, next); } catch { /* not persisted */ }
  }

  return (
    <div className={cn('inline-flex rounded-lg border border-border p-0.5', className)} role="radiogroup" aria-label="Thème">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          title={label}
          aria-label={label}
          onClick={() => choose(value)}
          className={cn(
            'flex items-center rounded-md p-1.5 transition-colors',
            theme === value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
