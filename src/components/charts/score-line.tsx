/** Minimal accessible SVG line chart for score history (0–100). */
export function ScoreLine({ points, height = 140 }: { points: { label: string; value: number }[]; height?: number }) {
  if (points.length < 2) return <p className="text-sm text-muted">Complete at least two attempts to see your trend.</p>;
  const w = 560, pad = 28;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (points.length - 1);
  const y = (v: number) => height - pad - (v / 100) * (height - pad * 2);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label={`Score history: ${points.map((p) => `${p.label} ${p.value}%`).join(", ")}`}>
        {[0, 50, 100].map((g) => (
          <g key={g}><line x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} className="stroke-line" strokeDasharray="3 4" /><text x={4} y={y(g) + 4} fontSize="10" className="fill-muted">{g}</text></g>
        ))}
        <path d={d} fill="none" stroke="#D6B66B" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.value)} r="4" fill="#193B68" stroke="#D6B66B" strokeWidth="2"><title>{`${p.label}: ${p.value}%`}</title></circle>)}
      </svg>
    </figure>
  );
}
