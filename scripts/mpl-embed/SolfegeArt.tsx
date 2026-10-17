/** Illustration de l'accueil du solfège : portée animée (les notes apparaissent une à une). */
export function SolfegeArt() {
  const notes = [
    { x: 150, y: 132 },
    { x: 200, y: 118 },
    { x: 250, y: 104 },
    { x: 300, y: 125 },
    { x: 350, y: 97 },
  ];
  return (
    <svg viewBox="0 0 440 300" className="mpl-art w-full max-w-[440px] justify-self-center" role="img" aria-label="Illustration : une portée avec des notes">
      <defs>
        <filter id="mpl-shadow" x="-20%" y="-20%" width="140%" height="170%">
          <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#0b2545" floodOpacity="0.28" />
        </filter>
      </defs>
      <circle cx="380" cy="50" r="46" fill="#fff" opacity="0.08" />
      <circle cx="70" cy="250" r="44" fill="#fff" opacity="0.06" />
      <g filter="url(#mpl-shadow)">
        <rect x="30" y="40" width="380" height="190" rx="22" fill="#fff" />
      </g>
      <g stroke="#0b2545" strokeWidth="1.6" opacity="0.85">
        {[0, 1, 2, 3, 4].map((k) => (
          <line key={k} x1="56" x2="384" y1={90 + k * 14} y2={90 + k * 14} />
        ))}
      </g>
      <text x="62" y="132" fontFamily="Bravura" fontSize="56" fill="#0b2545">
        {''}
      </text>
      {notes.map((n, i) => (
        <g key={n.x} className="mpl-note" style={{ animationDelay: `${i * 0.5}s` }} fill="#1d4ed8">
          <text x={n.x} y={n.y} fontFamily="Bravura" fontSize="56">
            {''}
          </text>
          <rect x={n.x + 14.6} y={n.y - 45} width="1.8" height="45" />
        </g>
      ))}
      <rect x="56" y="196" width="328" height="8" rx="4" fill="#dbe7ff" />
      <rect className="mpl-progress" x="56" y="196" width="160" height="8" rx="4" fill="#1d4ed8" />
      <g className="mpl-float" fill="#fff">
        <ellipse cx="392" cy="262" rx="10" ry="7.5" transform="rotate(-20 392 262)" />
        <rect x="398.5" y="222" width="3" height="40" />
        <path d="M401.5 222c8 4 12 9 10 17-3-6-6-8-10-9z" />
      </g>
    </svg>
  );
}
