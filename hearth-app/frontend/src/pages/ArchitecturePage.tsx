import { useJson } from '../data';

type IcebergTable = {
  database: 'bronze' | 'silver' | 'gold';
  table: string;
  rows: number;
  bytes: number;
  partitions: string[];
  source_system: string;
  last_updated_at: string;
  schema_columns: number;
};
type Iceberg = {
  catalog: string;
  lake: string;
  format: string;
  tables_total: number;
  rows_total: number;
  bytes_total: number;
  tables: IcebergTable[];
  engines: { name: string; status: string; description: string }[];
};

const SOURCES: { tag: string; name: string; lane: 'POS' | 'Digital' | 'Delivery' | 'Loyalty' | 'Workforce' | 'Supply' | 'Reviews'; note: string }[] = [
  { tag: 'POS',       lane: 'POS',       name: 'Toast POS',                  note: 'Order line items, modifiers, tenders, refunds.' },
  { tag: 'POS',       lane: 'POS',       name: 'NCR Aloha',                  note: 'Legacy chain stores; same gold-layer schema.' },
  { tag: 'POS',       lane: 'POS',       name: 'Square Terminal',            note: 'Regional pop-ups and airport stores.' },
  { tag: 'Digital',   lane: 'Digital',   name: 'Olo (mobile + web)',         note: 'Order-ahead, curbside, group orders, fulfillment.' },
  { tag: 'Digital',   lane: 'Digital',   name: 'Hearth App events',          note: 'Snowplow stream: opens, browses, carts, checkouts.' },
  { tag: 'Delivery',  lane: 'Delivery',  name: 'DoorDash Marketplace',       note: 'Marketplace orders + commissions.' },
  { tag: 'Delivery',  lane: 'Delivery',  name: 'Uber Eats',                  note: 'Marketplace orders + commissions.' },
  { tag: 'Delivery',  lane: 'Delivery',  name: 'Grubhub',                    note: 'Marketplace orders + commissions.' },
  { tag: 'Loyalty',   lane: 'Loyalty',   name: 'Salesforce Marketing Cloud', note: 'Loyalty member CDP, email + push journeys.' },
  { tag: 'Workforce', lane: 'Workforce', name: 'Workday HCM',                note: '92K worker master, comp + benefits.' },
  { tag: 'Workforce', lane: 'Workforce', name: 'Kronos / UKG',               note: 'Time + attendance, shift fill.' },
  { tag: 'Supply',    lane: 'Supply',    name: 'Coffee + Dairy ERP',         note: 'Green-bean lots, dairy receipts, supplier SLAs.' },
  { tag: 'Reviews',   lane: 'Reviews',   name: 'Yelp Reviews',               note: 'Store-level rating, review-text NLP.' },
  { tag: 'Reviews',   lane: 'Reviews',   name: 'Google Reviews',             note: 'Store-level rating, business profile.' },
];

const LANE_COLORS: Record<string, string> = {
  POS:       '#3c2817',
  Digital:   '#1f6f8b',
  Delivery:  '#b87333',
  Loyalty:   '#7a4a1f',
  Workforce: '#2d8659',
  Supply:    '#a05a2c',
  Reviews:   '#6b7280',
};

export default function ArchitecturePage() {
  const ice = useJson<Iceberg>('iceberg.json');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="eyebrow">ODI reference architecture</div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--espresso-deep)]">Architecture</h1>
        <p className="mt-2 text-[var(--ink-muted)] max-w-3xl leading-relaxed">
          Fourteen source systems land into a single Apache Iceberg lake on Amazon S3, owned by Hearth. dbt builds the bronze, silver, gold, and marts layers. Snowflake serves BI and the agents; Trino, DuckDB, and Spark read the same tables when the workload calls for it.
        </p>
      </header>

      <section className="research-card mb-10">
        <div className="research-card-header">
          <div className="eyebrow">Data flow</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Sources → Iceberg lake → engines + agents</h2>
        </div>
        <div className="p-5 overflow-x-auto">
          <svg viewBox="0 0 1080 460" className="w-full min-w-[860px] h-auto">
            {/* Source lanes */}
            <text x="20" y="22" fontSize="11" fontWeight="700" fill="#6b5742" letterSpacing="2">SOURCES</text>
            {SOURCES.map((s, i) => {
              const col = i % 2;
              const row = Math.floor(i / 2);
              const x = 20 + col * 150;
              const y = 36 + row * 50;
              return (
                <g key={s.name} transform={`translate(${x}, ${y})`}>
                  <rect width="140" height="42" rx="6" fill="#fffdf8" stroke={LANE_COLORS[s.lane]} strokeWidth="1.5" />
                  <text x="10" y="16" fontSize="9" fontWeight="700" fill={LANE_COLORS[s.lane]} letterSpacing="1.2">{s.tag.toUpperCase()}</text>
                  <text x="10" y="32" fontSize="11" fontWeight="600" fill="#3c2817">{s.name}</text>
                </g>
              );
            })}

            {/* Fivetran lineage label */}
            <g transform="translate(340, 200)">
              <rect width="100" height="60" rx="10" fill="#fbf2e6" stroke="#b87333" strokeWidth="2" />
              <text x="50" y="26" fontSize="10" fontWeight="700" fill="#8b5722" textAnchor="middle" letterSpacing="2">LINEAGE</text>
              <text x="50" y="46" fontSize="16" fontWeight="700" fill="#3c2817" textAnchor="middle" fontFamily="Fraunces, serif">Fivetran</text>
            </g>

            {/* arrows from sources area to fivetran */}
            <path d="M 320 220 L 340 220" stroke="#b87333" strokeWidth="1.5" fill="none" />
            <path d="M 320 240 L 340 240" stroke="#b87333" strokeWidth="1.5" fill="none" />

            {/* Iceberg lake */}
            <g transform="translate(470, 60)">
              <rect width="280" height="340" rx="14" fill="#3c2817" />
              <text x="140" y="32" fontSize="11" fontWeight="700" fill="#fbf2e6" textAnchor="middle" letterSpacing="2">CUSTOMER-OWNED LAKE</text>
              <text x="140" y="58" fontSize="18" fontWeight="700" fill="#fffdf8" textAnchor="middle" fontFamily="Fraunces, serif">Apache Iceberg v2</text>
              <text x="140" y="78" fontSize="11" fill="#e7dccc" textAnchor="middle" fontFamily="JetBrains Mono, monospace">s3://hearth-odi-lake</text>

              <g transform="translate(20, 100)">
                <rect width="240" height="48" rx="6" fill="#fbe9d5" />
                <text x="14" y="20" fontSize="9" fontWeight="800" fill="#a05a2c" letterSpacing="1.4">BRONZE</text>
                <text x="14" y="36" fontSize="11" fontWeight="600" fill="#3c2817">Raw landings · 168 tables</text>
              </g>
              <g transform="translate(20, 158)">
                <rect width="240" height="48" rx="6" fill="#f4f4f3" />
                <text x="14" y="20" fontSize="9" fontWeight="800" fill="#6b7280" letterSpacing="1.4">SILVER</text>
                <text x="14" y="36" fontSize="11" fontWeight="600" fill="#3c2817">Conformed entities · 72 tables</text>
              </g>
              <g transform="translate(20, 216)">
                <rect width="240" height="48" rx="6" fill="#fbf2e6" />
                <text x="14" y="20" fontSize="9" fontWeight="800" fill="#b87333" letterSpacing="1.4">GOLD</text>
                <text x="14" y="36" fontSize="11" fontWeight="600" fill="#3c2817">Governed business facts · 28 tables</text>
              </g>
              <g transform="translate(20, 274)">
                <rect width="240" height="48" rx="6" fill="#fbf2e6" stroke="#b87333" strokeWidth="1.5" />
                <text x="14" y="20" fontSize="9" fontWeight="800" fill="#b87333" letterSpacing="1.4">MARTS</text>
                <text x="14" y="36" fontSize="11" fontWeight="600" fill="#3c2817">Page-bound JSON · 14 tables</text>
              </g>
            </g>

            {/* arrow to engines */}
            <path d="M 760 230 L 800 230" stroke="#b87333" strokeWidth="1.5" fill="none" />
            <polygon points="800,225 808,230 800,235" fill="#b87333" />

            {/* Engines + agents */}
            <text x="810" y="22" fontSize="11" fontWeight="700" fill="#6b5742" letterSpacing="2">COMPUTE</text>
            {['Snowflake (primary)', 'Trino', 'DuckDB', 'Spark'].map((e, i) => (
              <g key={e} transform={`translate(810, ${40 + i * 44})`}>
                <rect width="240" height="36" rx="6" fill="#fffdf8" stroke="#3c2817" strokeWidth="1" />
                <text x="14" y="22" fontSize="12" fontWeight="600" fill="#3c2817">{e}</text>
              </g>
            ))}

            <text x="810" y="240" fontSize="11" fontWeight="700" fill="#8b5722" letterSpacing="2">AGENTS</text>
            {['Loyalty next-best-offer', 'Staffing optimizer', 'Supply-chain risk'].map((a, i) => (
              <g key={a} transform={`translate(810, ${256 + i * 44})`}>
                <rect width="240" height="36" rx="6" fill="#fbf2e6" stroke="#b87333" strokeWidth="1.5" />
                <text x="14" y="22" fontSize="12" fontWeight="600" fill="#3c2817">{a}</text>
              </g>
            ))}
          </svg>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="kpi-tile lg:col-span-1">
          <div className="kpi-tile-label">Tables in lake</div>
          <div className="kpi-tile-value tabular">{ice.data?.tables_total ?? '—'}</div>
          <div className="kpi-tile-delta flat">168 bronze · 72 silver · 28 gold · 14 marts</div>
        </div>
        <div className="kpi-tile lg:col-span-1">
          <div className="kpi-tile-label">Rows under management</div>
          <div className="kpi-tile-value tabular">{ice.data ? `${(ice.data.rows_total / 1e9).toFixed(1)}B` : '—'}</div>
          <div className="kpi-tile-delta flat">Append-only with ACID; Iceberg v2 row-level deletes available.</div>
        </div>
        <div className="kpi-tile lg:col-span-1">
          <div className="kpi-tile-label">Lake storage</div>
          <div className="kpi-tile-value tabular">{ice.data ? `${(ice.data.bytes_total / 1e12).toFixed(1)} TB` : '—'}</div>
          <div className="kpi-tile-delta flat">{ice.data?.format}</div>
        </div>
      </section>

      <section className="research-card mb-10">
        <div className="research-card-header">
          <div className="eyebrow">Iceberg tables</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Selected gold + silver objects</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--cream)] text-[var(--ink-soft)]">
              <tr>
                <th className="text-left px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Layer</th>
                <th className="text-left px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Table</th>
                <th className="text-right px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Rows</th>
                <th className="text-right px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Bytes</th>
                <th className="text-left px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Partitions</th>
                <th className="text-left px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody>
              {ice.data?.tables.map((t) => (
                <tr key={t.table} className="border-t border-[var(--hairline-soft)]">
                  <td className="px-4 py-2.5"><span className={`layer-chip ${t.database}`}>{t.database}</span></td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[var(--espresso-deep)]">{t.table}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] tabular">{t.rows.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] tabular">{(t.bytes / 1e9).toFixed(1)} GB</td>
                  <td className="px-4 py-2.5 text-[12px] text-[var(--ink-muted)]">{t.partitions.length ? t.partitions.join(', ') : 'unpartitioned'}</td>
                  <td className="px-4 py-2.5 text-[12px] font-mono text-[var(--ink-muted)]">{t.last_updated_at.replace('T', ' ').slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
