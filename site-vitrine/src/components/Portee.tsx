import type { CSSProperties } from 'react';

/** Portée musicale décorative (cinq lignes dorées). */
export function Portee({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 600 64" preserveAspectRatio="none" aria-hidden="true">
      {[2, 17, 32, 47, 62].map((y) => (
        <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
