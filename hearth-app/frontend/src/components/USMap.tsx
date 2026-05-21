// Lightweight US states map. Renders a grid-style cartogram so we don't
// need a topojson + leaflet dep. Each state is a small rounded square,
// colored by same-store sales bucket. Hover-tooltip via title attr.

type Bucket = 'good' | 'neutral' | 'warn' | 'alert';
type Item = { state: string; stores: number; sss_growth_pct: number; color_bucket: Bucket };

// Tile grid coordinates: [row, col] for each US state (Mercator-ish)
const GRID: Record<string, [number, number]> = {
  AK: [0, 0],
  ME: [0, 10], VT: [1, 9], NH: [1, 10], MA: [2, 10], RI: [2, 11], CT: [3, 10],
  WA: [1, 1], ID: [2, 2], MT: [1, 3], ND: [1, 4], MN: [1, 5], WI: [1, 6], MI: [1, 7], NY: [2, 9], NJ: [3, 9],
  OR: [2, 1], NV: [3, 2], WY: [2, 3], SD: [2, 4], IA: [2, 5], IL: [2, 6], IN: [2, 7], OH: [2, 8], PA: [2, 9], DE: [3, 10],
  CA: [3, 1], UT: [3, 3], CO: [3, 4], NE: [3, 5], MO: [3, 6], KY: [3, 7], WV: [3, 8], VA: [4, 8], MD: [4, 9],
  AZ: [4, 3], NM: [4, 4], KS: [4, 5], AR: [4, 6], TN: [4, 7], NC: [4, 9],
  OK: [5, 5], LA: [5, 6], MS: [5, 7], AL: [5, 8], GA: [5, 9], SC: [5, 10],
  HI: [6, 1], TX: [6, 4], FL: [6, 9],
};

const COLORS: Record<Bucket, string> = {
  good:    '#2d8659',
  neutral: '#b9a884',
  warn:    '#d97706',
  alert:   '#b91c1c',
};

export function USCartogram({ items }: { items: Item[] }) {
  const cellW = 50;
  const cellH = 44;
  const gap = 4;
  const cols = 12;
  const rows = 7;
  const W = cols * (cellW + gap);
  const H = rows * (cellH + gap);
  const byState = new Map(items.map((i) => [i.state, i]));
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[680px] h-auto" role="img" aria-label="Hearth Coffee Co. locations by US state, color-coded by same-store sales bucket.">
        {Object.entries(GRID).map(([state, [r, c]]) => {
          const item = byState.get(state);
          const fill = item ? COLORS[item.color_bucket] : '#e6dec8';
          const hasData = !!item;
          const x = c * (cellW + gap);
          const y = r * (cellH + gap);
          return (
            <g key={state} transform={`translate(${x}, ${y})`}>
              <rect
                width={cellW}
                height={cellH}
                rx={8}
                fill={hasData ? fill : '#efe9d8'}
                opacity={hasData ? 0.92 : 0.55}
                stroke="#3c2817"
                strokeOpacity={0.08}
                strokeWidth={1}
              >
                {item && (
                  <title>{`${state} · ${item.stores.toLocaleString()} stores · SSS ${item.sss_growth_pct >= 0 ? '+' : ''}${item.sss_growth_pct.toFixed(1)}%`}</title>
                )}
              </rect>
              <text x={cellW / 2} y={cellH / 2 - 2} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fffdf8" style={{ pointerEvents: 'none' }}>{state}</text>
              {item && (
                <text x={cellW / 2} y={cellH - 8} textAnchor="middle" fontSize={9} fill="#fffdf8" opacity={0.92} style={{ pointerEvents: 'none', fontFamily: 'JetBrains Mono, monospace' }}>
                  {`${item.sss_growth_pct >= 0 ? '+' : ''}${item.sss_growth_pct.toFixed(1)}`}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-muted)]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: COLORS.good }} /> Strong (&gt;3%)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: COLORS.neutral }} /> Neutral (2-3%)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: COLORS.warn }} /> Watch (1-2%)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: COLORS.alert }} /> Alert (&lt;1%)</span>
      </div>
    </div>
  );
}
