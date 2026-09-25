/** Decorative financial-crime network illustration: entities, flows and a screening lens. */
export function HeroArt() {
  const nodes = [
    { x: 70, y: 90, r: 7 }, { x: 170, y: 50, r: 5 }, { x: 250, y: 130, r: 9 }, { x: 120, y: 200, r: 6 },
    { x: 330, y: 70, r: 6 }, { x: 390, y: 180, r: 8 }, { x: 230, y: 260, r: 5 }, { x: 330, y: 300, r: 7 }, { x: 90, y: 310, r: 5 },
  ];
  const edges = [[0, 1], [1, 2], [0, 3], [2, 3], [2, 4], [4, 5], [2, 5], [3, 6], [6, 7], [5, 7], [3, 8], [6, 8]];
  return (
    <svg viewBox="0 0 460 380" className="h-full w-full" role="img" aria-label="Illustration of a financial network being analysed">
      <defs>
        <linearGradient id="hg-gold" x1="0" x2="1"><stop offset="0" stopColor="#E8D39A" /><stop offset="1" stopColor="#C49F48" /></linearGradient>
        <radialGradient id="hg-glow"><stop offset="0" stopColor="#D6B66B" stopOpacity=".35" /><stop offset="1" stopColor="#D6B66B" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="250" cy="140" r="130" fill="url(#hg-glow)" />
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="#D6B66B" strokeOpacity=".35" strokeWidth="1.2" />
      ))}
      <path d="M70 90 L170 50 L250 130 L390 180 L330 300" fill="none" stroke="url(#hg-gold)" strokeWidth="2.2" strokeDasharray="6 8" className="animate-pulse-line" />
      {nodes.map((n, i) => (
        <g key={i} className="animate-drift" style={{ animationDelay: `${i * 0.6}s` }}>
          <circle cx={n.x} cy={n.y} r={n.r + 6} fill="#193B68" fillOpacity=".55" />
          <circle cx={n.x} cy={n.y} r={n.r} fill={i === 2 || i === 5 ? "#D6B66B" : "#E6ECF5"} />
        </g>
      ))}
      <g transform="translate(250 130)">
        <circle r="46" fill="none" stroke="#D6B66B" strokeWidth="2.5" />
        <circle r="46" fill="#D6B66B" fillOpacity=".06" />
        <line x1="33" y1="33" x2="66" y2="66" stroke="#D6B66B" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g transform="translate(300 222)">
        <rect width="140" height="64" rx="12" fill="#0B1426" stroke="#D6B66B" strokeOpacity=".5" />
        <text x="14" y="24" fill="#D6B66B" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" letterSpacing="1.2">RISK SIGNAL</text>
        <rect x="14" y="36" width="112" height="6" rx="3" fill="#193B68" />
        <rect x="14" y="36" width="78" height="6" rx="3" fill="url(#hg-gold)" />
      </g>
      <g transform="translate(24 236)">
        <rect width="128" height="52" rx="12" fill="#0B1426" stroke="#E6ECF5" strokeOpacity=".2" />
        <text x="14" y="22" fill="#E6ECF5" fontSize="10.5" fontFamily="Inter, sans-serif" opacity=".7">Ownership</text>
        <text x="14" y="40" fill="#fff" fontSize="15" fontFamily="Manrope, sans-serif" fontWeight="700">≥ 50% blocked</text>
      </g>
    </svg>
  );
}
