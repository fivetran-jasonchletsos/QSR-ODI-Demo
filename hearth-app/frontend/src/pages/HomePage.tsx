import { useJson, fmtMoney, fmtNum } from '../data';
import { USCartogram } from '../components/USMap';

type Kpi = {
  id: string;
  label: string;
  value: number;
  unit: 'usd' | 'usd_dec' | 'pct' | 'stores' | 'people' | string;
  delta_label: string;
  delta_dir: 'up' | 'down' | 'flat';
};

type Issue = {
  id: string;
  severity: 'warn' | 'alert' | 'info';
  owner: string;
  title: string;
  summary: string;
  metric: string;
  agent_recommendation: string;
};

type Summary = {
  generated_at: string;
  as_of: string;
  kpis: Kpi[];
  issues_today: Issue[];
  channel_mix: { channel: string; share: number }[];
  weekly_orders_m: { week: string; orders: number }[];
};

type LocItem = { state: string; stores: number; sss_growth_pct: number; color_bucket: 'good' | 'neutral' | 'warn' | 'alert' };
type Locations = { state_index: LocItem[]; fleet_size: number };

function formatKpi(k: Kpi): string {
  switch (k.unit) {
    case 'usd':     return fmtMoney(k.value, { compact: true });
    case 'usd_dec': return `$${k.value.toFixed(2)}`;
    case 'pct':     return `${k.value.toFixed(1)}%`;
    case 'people':  return fmtNum(k.value, { compact: true });
    case 'stores':  return fmtNum(k.value);
    default:        return String(k.value);
  }
}

export default function HomePage() {
  const summary = useJson<Summary>('summary.json');
  const locations = useJson<Locations>('locations.json');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="eyebrow">Executive briefing · as of {summary.data?.as_of ?? '...'}</div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight mt-1">Hearth Coffee Co.</h1>
        <p className="mt-2 text-[var(--ink-muted)] max-w-3xl leading-relaxed">
          The single pane of glass for the Chief Digital Officer and the Chief Restaurant Operations Officer. Every tile, chart, and agent recommendation on this site reads from one governed Apache Iceberg lake, populated by Fivetran from fourteen source systems.
        </p>
      </header>

      <section aria-labelledby="kpis" className="mb-10">
        <h2 id="kpis" className="sr-only">Key performance indicators</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summary.data?.kpis.map((k) => (
            <div key={k.id} className="kpi-tile">
              <div className="kpi-tile-label">{k.label}</div>
              <div className="kpi-tile-value">{formatKpi(k)}</div>
              <div className={`kpi-tile-delta ${k.delta_dir}`}>
                <DeltaArrow dir={k.delta_dir} /> {k.delta_label}
              </div>
            </div>
          ))}
          {summary.loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="kpi-tile animate-pulse">
              <div className="kpi-tile-label opacity-30">loading</div>
              <div className="h-8 mt-2 w-20 rounded bg-[var(--cream-deep)]" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="research-card lg:col-span-2">
          <div className="research-card-header flex items-center justify-between gap-3">
            <div>
              <div className="eyebrow">Footprint</div>
              <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Locations by state · same-store sales bucket</h2>
            </div>
            <span className="status-pill copper">{locations.data?.fleet_size ?? '...'} stores</span>
          </div>
          <div className="p-5">
            {locations.data && <USCartogram items={locations.data.state_index} />}
          </div>
        </div>

        <div className="research-card">
          <div className="research-card-header">
            <div className="eyebrow">Channel mix · YTD</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Where the orders come in</h2>
          </div>
          <div className="p-5 space-y-3">
            {summary.data?.channel_mix.map((c) => (
              <div key={c.channel}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-[var(--ink)]">{c.channel}</span>
                  <span className="font-mono font-semibold text-[var(--espresso-deep)] tabular">{c.share.toFixed(1)}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-[var(--cream-deep)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.share}%`, background: 'linear-gradient(90deg, var(--copper-dim), var(--copper-bright))' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="eyebrow">On the desk today</div>
            <h2 className="font-serif text-2xl font-semibold text-[var(--espresso-deep)]">Top 3 issues</h2>
          </div>
          <span className="text-xs text-[var(--ink-soft)]">Surfaced by gold-layer signal models · refreshed every 15 min</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summary.data?.issues_today.map((iss) => (
            <article key={iss.id} className="research-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`status-pill ${iss.severity === 'alert' ? 'alert' : 'warn'}`}>{iss.severity}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">{iss.owner}</span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-[var(--espresso-deep)] leading-snug">{iss.title}</h3>
              <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">{iss.summary}</p>
              <div className="mt-3 px-3 py-2 rounded-md bg-[var(--cream-deep)] border border-[var(--hairline)]">
                <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Metric</div>
                <div className="font-mono text-[13px] text-[var(--espresso-deep)] mt-0.5">{iss.metric}</div>
              </div>
              <div className="mt-3 text-sm">
                <div className="text-[10px] uppercase tracking-wider text-[var(--copper-dim)] font-semibold">Agent recommendation</div>
                <p className="mt-1 text-[var(--ink)] leading-relaxed">{iss.agent_recommendation}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="research-card mb-10">
        <div className="research-card-header">
          <div className="eyebrow">Weekly orders · system-wide</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Demand pulse</h2>
        </div>
        <div className="p-5">
          {summary.data && <WeeklyOrdersChart data={summary.data.weekly_orders_m} />}
        </div>
      </section>
    </div>
  );
}

function DeltaArrow({ dir }: { dir: 'up' | 'down' | 'flat' }) {
  if (dir === 'up')   return <span aria-hidden>▲</span>;
  if (dir === 'down') return <span aria-hidden>▼</span>;
  return <span aria-hidden>=</span>;
}

function WeeklyOrdersChart({ data }: { data: { week: string; orders: number }[] }) {
  const W = 720;
  const H = 200;
  const pad = { l: 36, r: 16, t: 12, b: 28 };
  const max = Math.max(...data.map((d) => d.orders)) * 1.08;
  const min = Math.min(...data.map((d) => d.orders)) * 0.92;
  const xStep = (W - pad.l - pad.r) / (data.length - 1);
  const yOf = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - (v - min) / (max - min));
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${pad.l + i * xStep} ${yOf(d.orders)}`).join(' ');
  const area = `${path} L ${pad.l + (data.length - 1) * xStep} ${H - pad.b} L ${pad.l} ${H - pad.b} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="ho-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#b87333" stopOpacity="0.32" />
          <stop offset="1" stopColor="#b87333" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#ho-grad)" />
      <path d={path} fill="none" stroke="#8b5722" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={d.week}>
          <circle cx={pad.l + i * xStep} cy={yOf(d.orders)} r="3.2" fill="#fffdf8" stroke="#8b5722" strokeWidth="1.8" />
          <text x={pad.l + i * xStep} y={H - pad.b + 16} textAnchor="middle" fontSize="11" fill="#6b5742" fontFamily="JetBrains Mono, monospace">{d.week}</text>
          <text x={pad.l + i * xStep} y={yOf(d.orders) - 9} textAnchor="middle" fontSize="10" fill="#3c2817" fontWeight={600} fontFamily="JetBrains Mono, monospace">{d.orders.toFixed(1)}M</text>
        </g>
      ))}
      <text x={pad.l - 6} y={pad.t + 8} textAnchor="end" fontSize="10" fill="#8b7560" fontFamily="JetBrains Mono, monospace">{max.toFixed(0)}M</text>
      <text x={pad.l - 6} y={H - pad.b} textAnchor="end" fontSize="10" fill="#8b7560" fontFamily="JetBrains Mono, monospace">{min.toFixed(0)}M</text>
    </svg>
  );
}
