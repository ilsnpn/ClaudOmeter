import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  /** 0–1: the "C" fills up like a gauge (used as the loading bar). */
  progress?: number;
  /** Draws the mark in on mount (intro). */
  animated?: boolean;
}

// Claud'Ometer mark: a large "C" (open ring, accent color) holding a small "O".
export function Logo({ className, progress, animated }: LogoProps) {
  const gauge = progress !== undefined;
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn('h-8 w-8', animated && 'logo-intro', className)}>
      {gauge && (
        <path d="M25.19 8.29 A12 12 0 1 0 25.19 23.71" stroke="var(--muted)" strokeWidth="4" strokeLinecap="round" />
      )}
      <path
        className="logo-c"
        d="M25.19 8.29 A12 12 0 1 0 25.19 23.71"
        pathLength={100}
        stroke="var(--primary)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={gauge ? `${Math.max(progress, 0.001) * 100} 100` : undefined}
        style={gauge ? { transition: 'stroke-dasharray 200ms ease-out' } : undefined}
      />
      <circle className="logo-o" cx="16" cy="16" r="4.5" stroke="var(--foreground)" strokeWidth="3" />
    </svg>
  );
}
