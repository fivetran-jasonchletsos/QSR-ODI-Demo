// Hearth Coffee Co. — Open Data Infrastructure architecture page.
//
// Ported from Clarity Health's ArchitecturePage to give Hearth the same
// medallion / multi-engine surface for the Snowflake Summit 2026 reel.
// QSR-flavoured: Store POS (SQL Server) + Supply Chain (Oracle) + mobile
// app order stream + FDA recall feed. Snowflake stays primary engine;
// Athena/DuckDB/Trino/Spark stay listed as the same open-lake reads.
//
// The Iceberg catalog table is hydrated from /data/iceberg.json (same as
// before) so the page falls back gracefully if the connector fixtures
// haven't been regenerated.

import { useEffect, useState } from 'react';
import { AliveMedallion, type SourceNode, type EngineNode } from '../components/AliveMedallion';
import { useJson } from '../data';

const QSR_SOURCES: SourceNode[] = [
  { id: 'pos',    label: 'Store POS',         sub: 'SQL Server log-CDC',     logo: 'sqlserver', freshness: '39s lag',  status: 'healthy', pipelineUrl: 'https://fivetran.com/dashboard/connectors/stresses_mitigate' },
  { id: 'supply', label: 'Supply Chain',      sub: 'Oracle Binary Log Reader',         logo: 'oracle',    freshness: '2 min lag', status: 'healthy', pipelineUrl: 'https://fivetran.com/dashboard/connectors/speaking_superman' },
  { id: 'app',    label: 'Mobile App Orders', sub: 'Real-time event stream', logo: 'hl7',       freshness: 'live',      status: 'healthy', streaming: true },
  { id: 'fda',    label: 'FDA Recall Feed',   sub: 'Daily regulatory pull', logo: 'cms',       freshness: '1d lag',   status: 'healthy' },
];

const QSR_ENGINES: EngineNode[] = [
  { name: 'Snowflake', active: true,  logo: 'snowflake' },
  { name: 'Athena',                   logo: 'athena' },
  { name: 'DuckDB',                   logo: 'duckdb' },
  { name: 'Trino',                    logo: 'trino' },
  { name: 'Spark',                    logo: 'spark' },
];

const QSR_ROLES = [
  { label: 'Operations',    sub: 'store throughput' },
  { label: 'Marketing',     sub: 'LTOs & campaigns' },
  { label: 'Supply Chain',  sub: 'cost & freshness' },
  { label: 'Loyalty / App', sub: 'engagement & freq' },
];

// ─── Types loaded from iceberg.json ─────────────────────────────────────────
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
  engines?: { name: string; status: string; description: string }[];
};

// Fallback layer stats if iceberg.json hasn't loaded yet. Numbers keep the
// medallion alive in the demo recording even on first paint.
const FALLBACK_STATS = {
  bronze: { tables: 168, rows: 6_842_000_000, bytes: 1_840_000_000_000 },
  silver: { tables: 72,  rows: 2_410_000_000, bytes:   720_000_000_000 },
  gold:   { tables: 28,  rows:   840_000_000, bytes:   210_000_000_000 },
};

interface QueryEngine {
  name: 'Snowflake' | 'Athena' | 'DuckDB' | 'Trino' | 'Spark';
  status: 'active' | 'available' | 'demo';
  description: string;
  sample_query: string;
}

const ENGINES: QueryEngine[] = [
  {
    name: 'Snowflake',
    status: 'active',
    description: 'Primary engine for the Hearth gold layer. Reads Iceberg externals through Snowflake Open Catalog; auto-suspends between queries. Powers the operations site, the loyalty agents, and Cortex Analyst.',
    sample_query: `SELECT
  l.region, l.store_count,
  s.same_store_sales_growth_4w,
  o.avg_throughput_per_hour,
  a.mobile_order_share_pct
FROM gold.dim_locations           l
JOIN gold.fct_store_sales         s USING (location_id)
JOIN gold.fct_ops_throughput      o USING (location_id)
JOIN gold.fct_app_engagement      a USING (location_id)
WHERE s.same_store_sales_growth_4w >= 0.03
ORDER BY s.same_store_sales_growth_4w DESC
LIMIT 50;`,
  },
  {
    name: 'Athena',
    status: 'available',
    description: 'Serverless reads against the same Iceberg gold tables via Glue. Useful for finance + FP&A ad-hoc that doesn\'t need warehouse-resident compute.',
    sample_query: `SELECT day_part, SUM(net_sales) AS sales_30d
FROM gold.fct_store_sales
WHERE business_date >= current_date - interval '30' day
GROUP BY day_part
ORDER BY sales_30d DESC;`,
  },
  {
    name: 'DuckDB',
    status: 'available',
    description: 'Engineer\'s laptop. Same Iceberg tables, queried directly from S3 with the iceberg extension. Tiny ad-hoc joins without spinning up anything.',
    sample_query: `INSTALL iceberg;
LOAD iceberg;

SELECT *
FROM iceberg_scan('s3://hearth-odi-lake/gold/fct_supply_chain_risk/')
WHERE recall_class IN ('Class I','Class II')
LIMIT 100;`,
  },
  {
    name: 'Trino',
    status: 'available',
    description: 'Federated engine that joins the lake to other relational sources (legacy Aloha POS replicas, third-party loyalty CDPs) without copying data first.',
    sample_query: `SELECT s.region, AVG(s.ticket_avg) AS avg_ticket
FROM iceberg.gold.fct_store_sales s
JOIN postgres.legacy.aloha_store_xref x
  ON x.store_uid = s.location_id
WHERE s.day_part = 'AM'
GROUP BY s.region;`,
  },
  {
    name: 'Spark',
    status: 'available',
    description: 'Distributed compute for ML training and large cohort joins (loyalty next-best-offer, staffing forecasts). Reads the same Iceberg tables via the spark-iceberg runtime.',
    sample_query: `df = spark.read.format("iceberg")\\
  .load("gold.fct_loyalty_visits")
df.groupBy("segment", "day_part")\\
  .agg({"net_sales": "avg"})\\
  .show()`,
  },
];

const ENGINE_COLORS: Record<QueryEngine['name'], string> = {
  Snowflake: '#29b5e8',
  Athena:    '#b87333',
  DuckDB:    '#3c2817',
  Trino:     '#1f6f8b',
  Spark:     '#a05a2c',
};

// ─── Number formatters ──────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
function formatBytes(b: number): string {
  if (b >= 1_000_000_000_000) return `${(b / 1_000_000_000_000).toFixed(2)} TB`;
  if (b >= 1_000_000_000)     return `${(b / 1_000_000_000).toFixed(2)} GB`;
  if (b >= 1_000_000)         return `${(b / 1_000_000).toFixed(1)} MB`;
  if (b >= 1_000)             return `${(b / 1_000).toFixed(1)} KB`;
  return `${b} B`;
}

// =============================================================================
// Page
// =============================================================================
export default function ArchitecturePage() {
  const ice = useJson<Iceberg>('iceberg.json');
  const [activeEngine, setActiveEngine] = useState<QueryEngine>(ENGINES[0]);

  const tables = ice.data?.tables ?? [];
  const layerStats = (l: 'bronze' | 'silver' | 'gold') => {
    const t = tables.filter((r) => r.database === l);
    if (t.length === 0) return FALLBACK_STATS[l];
    return { tables: t.length, rows: t.reduce((s, r) => s + r.rows, 0), bytes: t.reduce((s, r) => s + r.bytes, 0) };
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-[var(--hairline)] pb-6">
        <div className="eyebrow mb-1">Open Data Infrastructure</div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--espresso-deep)]">
          One lake. Every engine. 4,800 stores in one operating picture.
        </h1>
        <p className="mt-3 text-[var(--ink-muted)] max-w-3xl leading-relaxed">
          Hearth Coffee Co. treats <em>storage</em>, <em>catalog</em>, and <em>compute</em> as three
          independently swappable layers. Iceberg is the storage spec. Glue is the catalog.
          Snowflake, Athena, DuckDB, Trino, and Spark can all read the same tables &mdash; no copy,
          no extract, no proprietary format between the POS and the analyst.
        </p>
      </header>

      <ThroughputHero />

      <section className="research-card mb-8 p-6 sm:p-8" style={cardStyle}>
        <div className="eyebrow mb-1">Data Flow</div>
        <h2 className="font-serif text-2xl font-semibold text-[var(--espresso-deep)] mb-6">
          From POS + supply + mobile + FDA to one governed gold layer
        </h2>

        <AliveMedallion
          sources={QSR_SOURCES}
          bronze={{ ...layerStats('bronze'), trend: [180, 195, 210, 222, 240, 255, 270] }}
          silver={{ ...layerStats('silver'), trend: [120, 130, 142, 155, 168, 180, 192] }}
          gold={{   ...layerStats('gold'),   trend: [80, 88, 95, 104, 112, 124, 138] }}
          engines={QSR_ENGINES}
          roles={QSR_ROLES}
          accent="#b87333"
        />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[var(--ink-muted)]">
          <LayerDetail layer="bronze" stats={layerStats('bronze')} desc="Raw rows landed by Fivetran. 1:1 with source. CDC kept current within five minutes across 4,800 stores." />
          <LayerDetail layer="silver" stats={layerStats('silver')} desc="Conformed dims and facts. Cleaned, deduped, joined to a store + product + customer spine." />
          <LayerDetail layer="gold"   stats={layerStats('gold')}   desc="Business-ready marts + the dbt semantic layer. What every operator-facing surface reads." />
        </div>
      </section>

      <SchemaEvolutionTicker />

      <CostPanel />

      <FailureRecoveryPanel />

      <DataContractsPanel />

      <LineagePanel />

      {/* ── Multi-engine showcase ────────────────────────────────────────── */}
      <section className="research-card overflow-hidden mb-8" style={cardStyle}>
        <header className="research-card-header" style={cardHeaderStyle}>
          <div className="eyebrow">Compute is a choice</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)] mt-0.5">
            Same Iceberg tables. Five engines. One query at a time.
          </h2>
          <p className="text-sm text-[var(--ink-muted)] mt-1">
            Pick a query engine &mdash; the SQL barely changes, but the operational, cost, and
            governance profile shifts dramatically. That choice belongs to Hearth, not the vendor.
          </p>
        </header>

        <div className="px-5 pt-4 flex flex-wrap gap-2">
          {ENGINES.map((e) => (
            <button
              key={e.name}
              onClick={() => setActiveEngine(e)}
              className="px-3 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider border transition-all"
              style={
                activeEngine.name === e.name
                  ? { background: ENGINE_COLORS[e.name], borderColor: ENGINE_COLORS[e.name], color: '#ffffff' }
                  : { background: '#ffffff', color: 'var(--ink-muted)', borderColor: 'var(--hairline)' }
              }
            >
              {e.name}
              {e.status === 'active' && <span className="ml-1.5 text-[9px] opacity-80">● ACTIVE</span>}
            </button>
          ))}
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold mb-2">Query</div>
            <pre className="rounded-sm p-4 text-[11.5px] leading-relaxed overflow-x-auto font-mono" style={{ background: '#261810', color: '#fbf2e6' }}>
              <code>{activeEngine.sample_query}</code>
            </pre>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold mb-2">Why this engine</div>
            <p className="text-sm text-[var(--ink)] leading-relaxed">{activeEngine.description}</p>
            <div className="mt-4 pt-4 border-t border-[var(--hairline-soft)]">
              <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold mb-1">Status</div>
              <div className="text-sm font-semibold" style={{ color: activeEngine.status === 'active' ? '#2d8659' : '#6b7280' }}>
                {activeEngine.status === 'active' ? '● Primary engine — powers this site' : 'Compatible and ready to wire in'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Iceberg catalog ──────────────────────────────────────────────── */}
      <section className="research-card overflow-hidden mb-8" style={cardStyle}>
        <header className="research-card-header" style={cardHeaderStyle}>
          <div className="eyebrow">Iceberg Catalog</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)] mt-0.5">
            Every table on the lake, registered in AWS Glue
          </h2>
          <p className="text-sm text-[var(--ink-muted)] mt-1">
            Open metadata. Every engine reads the same schema, the same partition layout, the same
            row counts &mdash; without anyone owning the "source of truth" exclusively.
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <thead className="border-b border-[var(--hairline)]" style={{ background: 'var(--cream)' }}>
              <tr>
                <Th>Layer</Th>
                <Th>Table</Th>
                <Th>Source</Th>
                <Th align="right">Rows</Th>
                <Th align="right">Size</Th>
                <Th align="right">Columns</Th>
                <Th>Partitions</Th>
                <Th align="right">Updated</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline-soft)]">
              {tables.map((t) => (
                <tr key={`${t.database}.${t.table}`} className="hover:bg-[var(--cream)] cursor-default">
                  <td className="px-4 py-2.5"><LayerChip layer={t.database} /></td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[var(--espresso-deep)]">{t.table}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--ink-muted)] font-mono">{t.source_system}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-[var(--espresso-deep)]">{formatNumber(t.rows)}</td>
                  <td className="px-4 py-2.5 text-right text-[var(--ink)]">{formatBytes(t.bytes)}</td>
                  <td className="px-4 py-2.5 text-right text-[var(--ink-muted)]">{t.schema_columns}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--ink-muted)] font-mono">
                    {t.partitions.length ? t.partitions.join(', ') : <span className="text-[var(--ink-soft)]">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-[var(--ink-muted)] font-mono">
                    {new Date(t.last_updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {tables.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-[var(--ink-muted)] text-xs">
                    Loading Iceberg catalog…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Data Quality — dbt Labs ──────────────────────────────────────── */}
      <section className="research-card overflow-hidden mb-8" style={cardStyle}>
        <header className="research-card-header flex items-start justify-between gap-4" style={cardHeaderStyle}>
          <div>
            <div className="eyebrow" style={{ color: '#FF694A' }}>Data Quality · dbt Labs</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)] mt-0.5">
              Every table tested. Every run. Same lake.
            </h2>
            <p className="text-sm text-[var(--ink-muted)] mt-1">
              Tests defined in dbt Labs run on every build, against the same Iceberg tables every
              engine reads. Failures block promotion to the next layer &mdash; bad data never
              reaches the floor. Paired with the Great Expectations checkpoints below: GX runs
              suite-based expectations against raw landings; dbt enforces SQL-native contracts
              across bronze, silver, and gold.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shrink-0" style={{ background: '#FF694A' }}>
            dbt Labs
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--hairline-soft)]">
          {[
            { layer: 'bronze' as const, tests: 28, passing: 28, monitors: ['freshness', 'volume', 'schema drift'],                                color: '#a05a2c' },
            { layer: 'silver' as const, tests: 64, passing: 63, monitors: ['nulls', 'uniqueness', 'referential', 'accepted values'],              color: '#6b7280' },
            { layer: 'gold'   as const, tests: 46, passing: 46, monitors: ['PCI-tagged PII', 'recall coverage', 'loyalty point reconciliation'],  color: '#b87333' },
          ].map((q) => {
            const ok = q.passing === q.tests;
            return (
              <div key={q.layer} className="p-5">
                <div className="flex items-center justify-between">
                  <LayerChip layer={q.layer} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ok ? '#2d8659' : '#b91c1c' }}>
                    {ok ? '● all passing' : `● ${q.tests - q.passing} warn`}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="font-serif text-3xl font-semibold text-[var(--espresso-deep)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {q.passing}<span className="text-[var(--ink-soft)]">/{q.tests}</span>
                  </div>
                  <div className="text-xs text-[var(--ink-muted)]">tests · last run 12m ago</div>
                </div>
                <ul className="mt-3 space-y-1.5 text-xs text-[var(--ink-muted)]">
                  {q.monitors.map((m) => (
                    <li key={m} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: q.color }} />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t border-[var(--hairline-soft)] flex items-center justify-between text-[11px] text-[var(--ink-soft)]" style={{ background: 'var(--cream)' }}>
          <span className="font-mono">138 tests · 137 passing · 1 warn · 0 errors</span>
          <span className="uppercase tracking-wider font-semibold">dbt build · merged into Fivetran</span>
        </div>
      </section>

      <GreatExpectationsPanel />

      <BeforeAfterPanel />
    </div>
  );
}

// =============================================================================
// Shared styles + sub-components
// =============================================================================

const cardStyle = {
  background: '#ffffff',
  border: '1px solid var(--hairline)',
  borderRadius: '4px',
};
const cardHeaderStyle = {
  padding: '20px',
  borderBottom: '1px solid var(--hairline-soft)',
};

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-soft)] ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

function LayerChip({ layer }: { layer: 'bronze' | 'silver' | 'gold' }) {
  const styles: Record<typeof layer, { bg: string; fg: string; border: string }> = {
    bronze: { bg: '#fbe9d5', fg: '#7a3d0f', border: '#a05a2c' },
    silver: { bg: '#f4f4f3', fg: '#374151', border: '#6b7280' },
    gold:   { bg: '#fbf2e6', fg: '#7a4a1f', border: '#b87333' },
  };
  const s = styles[layer];
  return (
    <span className="inline-block text-[9px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-sm border"
          style={{ background: s.bg, color: s.fg, borderColor: s.border }}>
      {layer}
    </span>
  );
}

function LayerDetail({ layer, stats, desc }: { layer: 'bronze' | 'silver' | 'gold'; stats: { tables: number; rows: number; bytes: number }; desc: string }) {
  return (
    <div className="border border-[var(--hairline)] rounded-sm p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <LayerChip layer={layer} />
        <span className="text-[10px] text-[var(--ink-soft)] font-mono">{stats.tables} table{stats.tables === 1 ? '' : 's'}</span>
      </div>
      <div className="text-sm font-bold text-[var(--espresso-deep)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatNumber(stats.rows)} rows · {formatBytes(stats.bytes)}
      </div>
      <div className="text-[11px] text-[var(--ink-muted)] mt-1 leading-snug">{desc}</div>
    </div>
  );
}

// =============================================================================
// ThroughputHero — pulsing live counter "rows in motion today"
// =============================================================================
function ThroughputHero() {
  const [rowsToday, setRowsToday] = useState(12_482_017);
  useEffect(() => {
    const id = setInterval(() => setRowsToday((n) => n + 14 + Math.floor(Math.random() * 22)), 600);
    return () => clearInterval(id);
  }, []);
  const trend = [9.4, 10.1, 10.6, 11.0, 11.5, 12.0, 12.48];
  return (
    <section className="mb-8 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 sm:gap-4">
      <div className="research-card p-5 sm:p-6 relative overflow-hidden" style={cardStyle}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(184,115,51,0.14), transparent 60%)' }} />
        <div className="relative">
          <div className="eyebrow" style={{ color: '#b87333' }}>● Live</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--ink-soft)] font-semibold">
            Rows in motion today
          </div>
          <div className="mt-2 font-serif font-semibold leading-none text-[var(--espresso-deep)]"
               style={{ fontSize: 44, fontVariantNumeric: 'tabular-nums' }}>
            {rowsToday.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-[var(--ink-muted)]">across 4 sources · 268 Iceberg tables · CDC + streaming</div>
        </div>
      </div>
      <Kpi label="CDC freshness · p50" value="39s" sub="SQL Server POS source" />
      <Kpi label="Bronze → Gold lag · p99" value="5 min" sub="Within 10-min SLO" />
      <Kpi label="Connector uptime · 90d" value="99.98%" sub={<Sparklike values={trend} />} />
    </section>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: React.ReactNode }) {
  return (
    <div className="research-card p-4 sm:p-5" style={cardStyle}>
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)] font-semibold">{label}</div>
      <div className="mt-1.5 font-serif font-semibold leading-none text-[var(--espresso-deep)]"
           style={{ fontSize: 30, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div className="mt-2 text-xs text-[var(--ink-muted)]">{sub}</div>
    </div>
  );
}

function Sparklike({ values }: { values: number[] }) {
  const max = Math.max(...values), min = Math.min(...values);
  const rng = max - min || 1;
  const w = 80, h = 18;
  const stepX = w / (values.length - 1);
  const pts = values.map((v, i) => `${(i * stepX).toFixed(1)},${(h - ((v - min) / rng) * h).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke="#b87333" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// =============================================================================
// SchemaEvolutionTicker
// =============================================================================
const EVO_EVENTS = [
  { ts: '2026-05-24 06:14', op: 'ADD COLUMN modifier_calories',         table: 'bronze.pos__order_lines',    ms: 38, models: 4 },
  { ts: '2026-05-23 22:01', op: 'RENAME COLUMN cust_id → customer_id',   table: 'bronze.pos__tenders',       ms: 22, models: 6 },
  { ts: '2026-05-22 14:47', op: 'WIDEN INT → BIGINT loyalty_points',     table: 'silver.int_loyalty',        ms: 41, models: 2 },
  { ts: '2026-05-21 09:30', op: 'ADD COLUMN day_part',                   table: 'gold.fct_store_sales',      ms: 19, models: 8 },
  { ts: '2026-05-20 18:09', op: 'DROP COLUMN deprecated_promo_code',     table: 'bronze.pos__order_header',  ms: 28, models: 3 },
];
function SchemaEvolutionTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((n) => (n + 1) % EVO_EVENTS.length), 4200);
    return () => clearInterval(id);
  }, []);
  const e = EVO_EVENTS[idx];
  return (
    <section className="mb-8 research-card p-5 overflow-hidden relative" style={{ ...cardStyle, background: 'linear-gradient(90deg, #fff 0%, #faf6ee 100%)' }}>
      <div className="absolute top-0 right-0 bottom-0 w-1.5" style={{ background: 'linear-gradient(180deg, #b87333, #3c2817)' }} />
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="eyebrow" style={{ color: '#1f6f8b' }}>Iceberg · Schema evolution</div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm" style={{ color: '#2d8659', background: '#e8f5ee', border: '1px solid #b8e0c8' }}>
            ● Live feed
          </span>
        </div>
        <div className="font-mono text-[10px] text-[var(--ink-soft)]">last 5 schema changes</div>
      </div>
      <div className="mt-3 flex items-center gap-3 flex-wrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <span className="font-mono text-[11px] text-[var(--ink-soft)]">{e.ts}</span>
        <span className="font-mono text-[13px] font-semibold text-[var(--espresso-deep)]">{e.op}</span>
        <span className="font-mono text-[12px] text-[var(--ink-muted)]">on {e.table}</span>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[12px] text-[var(--ink-muted)] flex-wrap">
        <span><strong className="text-[var(--espresso-deep)]">{e.ms} ms</strong> · metadata-only operation</span>
        <span>•</span>
        <span>0 data rewritten · 0 downtime</span>
        <span>•</span>
        <span><strong className="text-[var(--espresso-deep)]">{e.models}</strong> downstream dbt models auto-revalidated</span>
      </div>
      <div className="mt-3 text-[11px] text-[var(--ink-soft)] leading-relaxed">
        Apache Iceberg treats schema changes as table metadata, not file rewrites. The Modern Data Stack equivalent —
        an Oracle <code className="font-mono">ALTER TABLE ADD COLUMN</code> on a 6.8 B-row POS table — locks the
        table for ~12 minutes during the rewrite. Same change in Iceberg: <strong>milliseconds, no lock</strong>.
      </div>
    </section>
  );
}

// =============================================================================
// CostPanel
// =============================================================================
function CostPanel() {
  return (
    <section className="mb-8 research-card overflow-hidden" style={cardStyle}>
      <header className="research-card-header" style={cardHeaderStyle}>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <div className="eyebrow" style={{ color: '#b87333' }}>FinOps</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)] mt-0.5">
              What this costs to run, every day
            </h2>
            <p className="text-sm text-[var(--ink-muted)] mt-1 max-w-3xl">
              Storage and compute billed separately. Storage is essentially free at this scale; compute scales
              with workload because Snowflake warehouses auto-suspend when no one is reading.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shrink-0" style={{ background: '#2d8659' }}>
            −71% vs legacy
          </div>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[var(--hairline-soft)]">
        <CostTile label="Storage · per day"   value="$2.40"  sub="6.8 TB across bronze/silver/gold · S3 Standard-IA"  color="#2d8659" />
        <CostTile label="Compute · per day"   value="$11.80" sub="Snowflake S auto-suspend · dbt cloud · Athena ad-hoc" color="#b87333" />
        <CostTile label="Per-1k rows landed"  value="$0.0009" sub="All-in CDC + transform + serve"                    color="#1f6f8b" />
        <CostTile label="Equivalent MDS"      value="$48.60" sub="Internal benchmark · same data, warehouse-resident" color="#b91c1c" />
      </div>
      <div className="px-5 py-3 border-t border-[var(--hairline-soft)] flex items-center justify-between text-[11px] text-[var(--ink-soft)] bg-[var(--cream)]">
        <span>Compute curve: 65% of spend is the 6 AM–10 AM AM-rush reporting window. Idle hours bill at zero.</span>
        <span className="uppercase tracking-wider font-semibold">Cost-attribution: per-warehouse + per-dbt-model</span>
      </div>
    </section>
  );
}

function CostTile({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="p-5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)] font-semibold">{label}</div>
      <div className="mt-2 font-serif font-semibold leading-none" style={{ fontSize: 30, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div className="mt-2 text-xs text-[var(--ink-muted)] leading-snug">{sub}</div>
    </div>
  );
}

// =============================================================================
// FailureRecoveryPanel
// =============================================================================
function FailureRecoveryPanel() {
  return (
    <section className="mb-8 research-card overflow-hidden" style={cardStyle}>
      <header className="research-card-header" style={cardHeaderStyle}>
        <div className="eyebrow" style={{ color: '#a05a2c' }}>Resilience · Recovery</div>
        <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)] mt-0.5">
          What happens when a connector fails
        </h2>
        <p className="text-sm text-[var(--ink-muted)] mt-1 max-w-3xl">
          Every Fivetran connector has automatic retry with exponential backoff; failed rows land in a
          dead-letter queue for replay; dbt builds gate gold on green silver. Below: the last 30 days.
        </p>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y-0 md:divide-x divide-[var(--hairline-soft)]">
        <RecoveryTile label="Retry policy"          big="exp 5×"  sub="2s · 8s · 30s · 2m · 8m, then DLQ" />
        <RecoveryTile label="Dead-letter · current" big="22"      sub="rows held · 18 mobile-app, 4 FDA dupe-key" color="#a05a2c" />
        <RecoveryTile label="MTTR · last 30d"       big="4 min"   sub="median · max 18 min during POS cert rotation" />
        <RecoveryTile label="Last incident"         big="6 d ago" sub="Replayed automatically in 2 min, zero data loss" color="#2d8659" />
      </div>
    </section>
  );
}

function RecoveryTile({ label, big, sub, color = 'var(--espresso-deep)' }: { label: string; big: string; sub: string; color?: string }) {
  return (
    <div className="p-5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)] font-semibold">{label}</div>
      <div className="mt-1.5 font-serif font-semibold leading-none" style={{ fontSize: 26, color, fontVariantNumeric: 'tabular-nums' }}>
        {big}
      </div>
      <div className="mt-2 text-xs text-[var(--ink-muted)] leading-snug">{sub}</div>
    </div>
  );
}

// =============================================================================
// DataContractsPanel — PCI / FDA / SOC2 governance
// =============================================================================
function DataContractsPanel() {
  return (
    <section className="mb-8 research-card overflow-hidden" style={cardStyle}>
      <header className="research-card-header flex items-start justify-between gap-4" style={cardHeaderStyle}>
        <div>
          <div className="eyebrow" style={{ color: '#5b21b6' }}>Data Contracts · PCI / FDA Governance</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)] mt-0.5">
            Card data, customer PII, and recall data never leave the lake without a policy
          </h2>
          <p className="text-sm text-[var(--ink-muted)] mt-1 max-w-3xl">
            Every column with cardholder data or customer PII is tagged at ingest. Row-level access
            scopes by franchise group. Column masking on PAN, email, phone. Every read goes to a SOC 2 audit log.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shrink-0" style={{ background: '#5b21b6' }}>
          PCI · FDA · SOC 2
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[var(--hairline-soft)]">
        <div className="p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)] font-semibold mb-3">Policy coverage</div>
          <ul className="space-y-2 text-sm">
            <Policy label="PCI / PII columns tagged"  value="28 columns across 11 tables" />
            <Policy label="Row-level access policy"   value="franchise_group_id scoped per role" />
            <Policy label="Column masking on read"    value="pan · email · phone · loyalty_id · address" />
            <Policy label="Audit log destination"     value="CloudTrail → S3 (90d) → Iceberg audit table" />
            <Policy label="FDA recall lineage"        value="gold.fct_supply_chain_risk joins recall feed to lots in-store" />
          </ul>
        </div>
        <div className="p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)] font-semibold mb-3">Sample contract · gold.dim_customers</div>
          <pre className="font-mono text-[11.5px] leading-relaxed overflow-x-auto rounded-sm p-3" style={{ background: '#261810', color: '#fbf2e6' }}><code>{`columns:
  - name: customer_id
    tests: [unique, not_null]
    meta: { contains_pii: true, mask_policy: "tokenise" }
  - name: pan_last4
    tests: [not_null]
    meta: { contains_pci: true, mask_policy: "redact_full" }
  - name: email
    meta: { contains_pii: true, mask_policy: "hash_sha256" }
  - name: franchise_group_id
    tests: [relationships: dim_franchise_groups]
    meta: { rls_partition_key: true }`}</code></pre>
        </div>
      </div>
    </section>
  );
}

function Policy({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#5b21b6' }} />
      <div className="flex-1">
        <span className="text-[var(--espresso-deep)] font-semibold">{label}</span>
        <span className="text-[var(--ink-muted)]"> · {value}</span>
      </div>
    </li>
  );
}

// =============================================================================
// GreatExpectationsPanel — Fivetran-stewarded OSS data-quality gate
// =============================================================================
interface GxSuite {
  suite: string;
  table: string;
  layer: 'bronze' | 'silver' | 'gold';
  expectations: number;
  passing: number;
  last_run: string;
  why: string;
}

const GX_SUITES: GxSuite[] = [
  {
    suite: 'pos.toast_orders.completeness',
    table: 'bronze.toast_pos_orders',
    layer: 'bronze',
    expectations: 17,
    passing: 17,
    last_run: '07:14:22',
    why: 'check_id unique + not null; store_id resolves to dim_stores; daypart ∈ {breakfast, lunch, dinner, late}; ticket_total ≥ 0.',
  },
  {
    suite: 'pos.menu_items.referential',
    table: 'bronze.toast_pos_orders',
    layer: 'bronze',
    expectations: 13,
    passing: 12,
    last_run: '07:14:31',
    why: 'Every line item resolves to a known menu_item_id in dim_menu_items; one warn this run on a discontinued LTO SKU still firing on three stores.',
  },
  {
    suite: 'ops.drive_thru.ranges',
    table: 'bronze.toast_pos_orders',
    layer: 'bronze',
    expectations: 9,
    passing: 9,
    last_run: '07:11:18',
    why: 'order-to-handoff time in [0, 1800] seconds; wait_time never negative; throughput ≤ 300 orders/hour per lane.',
  },
  {
    suite: 'supply.erp_lots.contract',
    table: 'bronze.supplier_erp_lots',
    layer: 'bronze',
    expectations: 14,
    passing: 14,
    last_run: '07:11:09',
    why: 'lot_id unique; supplier_id resolves to dim_suppliers; received_dt ≤ today; lot_qty ≥ 0; expiration_dt ≥ received_dt.',
  },
  {
    suite: 'ops.food_safety.temp_log',
    table: 'bronze.kronos_time_entries',
    layer: 'bronze',
    expectations: 11,
    passing: 11,
    last_run: '07:13:48',
    why: 'Walk-in temp logs in [32, 41] °F; hot-hold ≥ 135 °F; cold-hold ≤ 41 °F; log_ts within last 24 hours.',
  },
  {
    suite: 'silver.pos_unified.integrity',
    table: 'silver.fct_pos_orders_unified',
    layer: 'silver',
    expectations: 21,
    passing: 21,
    last_run: '07:18:14',
    why: 'One row per (order_id, channel) across Toast + Aloha + Olo; no orphan lines; tip_pct in [0, 0.40].',
  },
  {
    suite: 'gold.dim_stores.contract',
    table: 'gold.dim_stores',
    layer: 'gold',
    expectations: 15,
    passing: 15,
    last_run: '07:22:51',
    why: 'Output contract: store_id unique; region ∈ published set; open_dt ≤ today; row count within ±2% of yesterday.',
  },
  {
    suite: 'gold.fct_store_day.reconciliation',
    table: 'gold.fct_store_day',
    layer: 'gold',
    expectations: 12,
    passing: 12,
    last_run: '07:22:59',
    why: 'Daily store sales reconcile within $0.01 of bronze.toast + bronze.aloha + bronze.olo sums; same-store-sales never null.',
  },
];

function GreatExpectationsPanel() {
  const totals = GX_SUITES.reduce(
    (a, s) => ({ exp: a.exp + s.expectations, pass: a.pass + s.passing, suites: a.suites + 1 }),
    { exp: 0, pass: 0, suites: 0 },
  );
  const warns = totals.exp - totals.pass;

  return (
    <section className="mb-8 research-card overflow-hidden" style={cardStyle}>
      <header className="research-card-header flex items-start justify-between gap-4" style={cardHeaderStyle}>
        <div>
          <div className="eyebrow" style={{ color: '#9a3412' }}>Data Quality · Great Expectations</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)] mt-0.5">
            Validation runs on Bronze before anything reaches Silver.
          </h2>
          <p className="text-sm text-[var(--ink-muted)] mt-1 max-w-3xl">
            Expectation suites define what "valid" looks like for each QSR table &mdash;
            POS transaction completeness, drive-thru wait-time ranges, menu_item referential
            integrity, food-safety temp-log bounds. A failed expectation blocks promotion.
            Same lake, same Iceberg snapshots, just gated.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: '#9a3412' }}>
            GX Core · OSS
          </div>
          <div className="text-[10px] text-[var(--ink-soft)] font-mono">Fivetran-stewarded</div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 divide-y-0 md:divide-x divide-[var(--hairline-soft,#e8e4d8)]">
        <RecoveryTile label="Expectation suites"     big={String(totals.suites)} sub="across bronze · silver · gold layers" />
        <RecoveryTile label="Expectations · today"   big={`${totals.pass}/${totals.exp}`} sub={`${warns} warn · 0 errors · gates Silver promotion`} color={warns ? '#b45309' : '#16a34a'} />
        <RecoveryTile label="Checkpoint cadence"     big="every sync" sub="triggered by Fivetran sync-complete · runs before dbt build" />
        <RecoveryTile label="Failed-expectation queue" big="4 rows" sub="retired LTO SKU still firing on 3 stores · held in dlq.gx_quarantine · auto-retried after suite update" color="#b45309" />
      </div>

      <div className="overflow-x-auto border-t border-[var(--hairline-soft,#e8e4d8)]">
        <table className="min-w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <thead className="border-b border-[var(--hairline)]" style={{ background: 'var(--paper-deep,#f4efe2)' }}>
            <tr>
              <Th>Layer</Th>
              <Th>Suite</Th>
              <Th>Table under test</Th>
              <Th align="right">Expectations</Th>
              <Th align="right">Last run</Th>
              <Th>What it asserts</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hairline-soft,#e8e4d8)]">
            {GX_SUITES.map((s) => {
              const ok = s.passing === s.expectations;
              return (
                <tr key={s.suite} className="hover:bg-[var(--paper-deep,#f4efe2)] cursor-default">
                  <td className="px-4 py-2.5"><LayerChip layer={s.layer} /></td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[var(--espresso-deep)]">{s.suite}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--ink-muted)] font-mono">{s.table}</td>
                  <td className="px-4 py-2.5 text-right font-semibold" style={{ color: ok ? '#16a34a' : '#b45309' }}>
                    {s.passing}/{s.expectations}
                    {!ok && <span className="ml-1 text-[10px] uppercase tracking-wider">warn</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-[var(--ink-muted)] font-mono">{s.last_run}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--ink)] leading-snug max-w-md">{s.why}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[var(--hairline-soft,#e8e4d8)] border-t border-[var(--hairline-soft,#e8e4d8)]">
        <div className="p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)] font-semibold mb-3">Sample expectation suite · pos.toast_orders.completeness</div>
          <pre className="font-mono text-[11.5px] leading-relaxed overflow-x-auto rounded-sm p-3" style={{ background: '#0b2545', color: '#e6e9f0' }}><code>{`# pos_toast_orders_completeness.yml
expectation_suite_name: pos.toast_orders.completeness
data_asset_name: bronze.toast_pos_orders

expectations:
  - expect_column_values_to_not_be_null:
      column: check_id
  - expect_column_values_to_be_unique:
      column: check_id
  - expect_column_values_to_be_in_set:
      column: daypart
      value_set: [breakfast, lunch, dinner, late]
  - expect_column_values_to_be_between:
      column: ticket_total_usd
      min_value: 0
      max_value: 500
  - expect_column_values_to_be_between:
      column: drive_thru_wait_seconds
      min_value: 0
      max_value: 1800
  - expect_table_row_count_to_be_between:
      min_value: 500000
      max_value: 900000`}</code></pre>
        </div>
        <div className="p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)] font-semibold mb-3">How this fits the stack</div>
          <ul className="space-y-2.5 text-sm">
            <Policy label="Fivetran moves" value="POS CDC · supplier ERP · mobile app stream · FDA recall feed into Bronze (Iceberg)" />
            <Policy label="Great Expectations validates" value="Bronze landings against suites before Silver promotion" />
            <Policy label="dbt transforms" value="Silver + Gold marts; dbt tests assert SQL-level constraints" />
            <Policy label="Failed rows" value="route to dlq.gx_quarantine on the same lake; retried after suite update" />
            <Policy label="Open source" value="GX Core remains community-driven; Fivetran funds maintenance, ecosystem, and engineering investment" />
            <Policy label="Community" value="github.com/great-expectations/great_expectations · thousands of teams use GX outside Fivetran's customer base" />
          </ul>
          <div className="mt-4 pt-3 border-t border-[var(--hairline-soft,#e8e4d8)] text-[11px] text-[var(--ink-soft)] leading-relaxed">
            On May 13, 2026 Fivetran announced it is becoming steward of the Great Expectations open
            source community and the GX Core project, supporting ongoing maintenance, ecosystem
            integrations, and community engagement. Same open project, backed by sustained engineering.
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// BeforeAfterPanel
// =============================================================================
function BeforeAfterPanel() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="research-card p-6 border-l-4" style={{ ...cardStyle, borderLeftColor: '#b91c1c' }}>
        <div className="eyebrow" style={{ color: '#b91c1c' }}>Before · Modern Data Stack</div>
        <h3 className="mt-1 font-serif text-xl font-semibold text-[var(--espresso-deep)]">14 hops · 3 copies of the bytes</h3>
        <pre className="font-mono text-[10.5px] leading-relaxed mt-4 p-3 rounded-sm overflow-x-auto" style={{ background: '#fdecec', color: '#7f1d1d', border: '1px solid #fecaca' }}>{`POS → SFTP → Stitch → Snowflake (raw)
   → dbt → Snowflake (silver) → Snowflake (gold)
   → Census reverse-ETL → Hightouch → loyalty CDP
   → Looker materialised view → BI extract → ops laptop`}</pre>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-[var(--ink-soft)] text-xs">Copies of the data</div><div className="font-serif text-2xl font-semibold text-[var(--espresso-deep)]">3</div></div>
          <div><div className="text-[var(--ink-soft)] text-xs">Avg end-to-end latency</div><div className="font-serif text-2xl font-semibold text-[var(--espresso-deep)]">18 hr</div></div>
          <div><div className="text-[var(--ink-soft)] text-xs">Daily run-rate</div><div className="font-serif text-2xl font-semibold text-[var(--espresso-deep)]">$48.60</div></div>
          <div><div className="text-[var(--ink-soft)] text-xs">Schema change</div><div className="font-serif text-lg font-semibold text-[var(--espresso-deep)]">12-min lock</div></div>
        </div>
      </div>
      <div className="research-card p-6 border-l-4" style={{ ...cardStyle, borderLeftColor: '#b87333' }}>
        <div className="eyebrow" style={{ color: '#b87333' }}>After · Open Data Infrastructure</div>
        <h3 className="mt-1 font-serif text-xl font-semibold text-[var(--espresso-deep)]">5 hops · 1 copy of the bytes</h3>
        <pre className="font-mono text-[10.5px] leading-relaxed mt-4 p-3 rounded-sm overflow-x-auto" style={{ background: '#fbf2e6', color: '#5a3d28', border: '1px solid #ebcfa3' }}>{`POS → Fivetran CDC → Iceberg bronze
   → dbt → Iceberg silver
   → dbt → Iceberg gold
   ↳ Snowflake · Athena · DuckDB · Trino · Spark
     (all reading the same bytes, no copies)`}</pre>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-[var(--ink-soft)] text-xs">Copies of the data</div><div className="font-serif text-2xl font-semibold" style={{ color: '#b87333' }}>1</div></div>
          <div><div className="text-[var(--ink-soft)] text-xs">Avg end-to-end latency</div><div className="font-serif text-2xl font-semibold" style={{ color: '#b87333' }}>5 min</div></div>
          <div><div className="text-[var(--ink-soft)] text-xs">Daily run-rate</div><div className="font-serif text-2xl font-semibold" style={{ color: '#b87333' }}>$14.20</div></div>
          <div><div className="text-[var(--ink-soft)] text-xs">Schema change</div><div className="font-serif text-lg font-semibold" style={{ color: '#b87333' }}>milliseconds</div></div>
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// LineagePanel — interactive lineage from gold back to bronze
// =============================================================================
type LineageEdge = { from: string; to: string; tests?: string[] };

const LINEAGE_MAP: Record<string, { silver: string[]; bronze: string[]; edges: LineageEdge[]; story: string }> = {
  'gold.fct_store_sales': {
    silver: ['silver.int_orders', 'silver.int_tenders', 'silver.int_store_calendar'],
    bronze: ['bronze.pos__order_header', 'bronze.pos__order_lines', 'bronze.pos__tenders'],
    story:  'Same-store sales facts. Aggregated to store + business_date + day_part. Powers the operations dashboard.',
    edges: [
      { from: 'bronze.pos__order_header', to: 'silver.int_orders', tests: ['unique order_id'] },
      { from: 'bronze.pos__order_lines',  to: 'silver.int_orders' },
      { from: 'bronze.pos__tenders',      to: 'silver.int_tenders' },
      { from: 'silver.int_orders',        to: 'gold.fct_store_sales' },
      { from: 'silver.int_tenders',       to: 'gold.fct_store_sales' },
      { from: 'silver.int_store_calendar', to: 'gold.fct_store_sales' },
    ],
  },
  'gold.fct_loyalty_visits': {
    silver: ['silver.int_loyalty', 'silver.int_orders'],
    bronze: ['bronze.app__events', 'bronze.pos__order_header', 'bronze.pos__loyalty_redemptions'],
    story:  'Loyalty member visit facts. Joins mobile app stream events to in-store transactions for a single customer journey.',
    edges: [
      { from: 'bronze.app__events',                to: 'silver.int_loyalty', tests: ['streaming · 8 s p99'] },
      { from: 'bronze.pos__loyalty_redemptions',    to: 'silver.int_loyalty' },
      { from: 'bronze.pos__order_header',           to: 'silver.int_orders' },
      { from: 'silver.int_loyalty',                 to: 'gold.fct_loyalty_visits' },
      { from: 'silver.int_orders',                  to: 'gold.fct_loyalty_visits' },
    ],
  },
  'gold.fct_supply_chain_risk': {
    silver: ['silver.int_inventory', 'silver.int_recalls'],
    bronze: ['bronze.supply__receipts', 'bronze.supply__lots', 'bronze.fda__recalls'],
    story:  'FDA recall lineage joined to in-store lot inventory. Drives the recall-response runbook.',
    edges: [
      { from: 'bronze.supply__receipts', to: 'silver.int_inventory' },
      { from: 'bronze.supply__lots',     to: 'silver.int_inventory' },
      { from: 'bronze.fda__recalls',     to: 'silver.int_recalls' },
      { from: 'silver.int_inventory',    to: 'gold.fct_supply_chain_risk' },
      { from: 'silver.int_recalls',      to: 'gold.fct_supply_chain_risk' },
    ],
  },
  'gold.dim_locations': {
    silver: ['silver.int_store_master'],
    bronze: ['bronze.pos__store_master'],
    story:  'Master store dimension across 4,800 locations. PII-tagged operator contacts, masked on read by role.',
    edges: [
      { from: 'bronze.pos__store_master', to: 'silver.int_store_master' },
      { from: 'silver.int_store_master',  to: 'gold.dim_locations' },
    ],
  },
};

function LineagePanel() {
  const goldOptions = Object.keys(LINEAGE_MAP);
  const [selected, setSelected] = useState<string>(goldOptions[0]);
  const lin = LINEAGE_MAP[selected];

  const BX = 20, MX = 320, RX = 620;
  const COL_W = 280;
  const ROW_H = 38, ROW_GAP = 8;
  const maxRows = Math.max(lin.bronze.length, lin.silver.length, 1);
  const HEIGHT = Math.max(maxRows * (ROW_H + ROW_GAP) + 40, 240);

  const bronzeY = (i: number) => 30 + i * (ROW_H + ROW_GAP);
  const silverY = (i: number) => 30 + i * (ROW_H + ROW_GAP);
  const goldY = (HEIGHT - ROW_H) / 2;

  const nodeOf = (name: string): { x: number; y: number; w: number; h: number } | null => {
    const bi = lin.bronze.indexOf(name);
    if (bi >= 0) return { x: BX, y: bronzeY(bi), w: COL_W, h: ROW_H };
    const si = lin.silver.indexOf(name);
    if (si >= 0) return { x: MX, y: silverY(si), w: COL_W, h: ROW_H };
    if (name === selected) return { x: RX, y: goldY, w: COL_W, h: ROW_H };
    return null;
  };

  return (
    <section className="mb-8 research-card overflow-hidden" style={cardStyle}>
      <header className="research-card-header" style={cardHeaderStyle}>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <div className="eyebrow" style={{ color: '#FF694A' }}>dbt · Column-level lineage</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)] mt-0.5">
              Pick any gold model. See exactly where its bytes come from.
            </h2>
            <p className="text-sm text-[var(--ink-muted)] mt-1 max-w-3xl">
              dbt emits lineage as a side-effect of build. Every join, every transformation, every test
              is documented automatically. Click a gold model below to trace upstream &mdash; bronze
              landings to silver intermediates to the gold mart.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shrink-0" style={{ background: '#FF694A' }}>
            dbt Labs
          </div>
        </div>
      </header>

      <div className="px-5 pt-4 flex flex-wrap gap-2">
        {goldOptions.map((g) => (
          <button
            key={g}
            onClick={() => setSelected(g)}
            className="px-3 py-2 rounded-sm text-[11.5px] font-mono border transition-all"
            style={
              selected === g
                ? { background: '#b87333', borderColor: '#b87333', color: '#fff' }
                : { background: '#fff', borderColor: 'var(--hairline)', color: 'var(--ink-muted)' }
            }
          >
            {g}
          </button>
        ))}
      </div>

      <div className="p-5">
        <p className="text-sm text-[var(--ink)] mb-4 italic">{lin.story}</p>

        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${RX + COL_W + 20} ${HEIGHT}`} className="w-full" style={{ minWidth: 880, maxHeight: 360 }}>
            <defs>
              <marker id="lin-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill="#FF694A" />
              </marker>
            </defs>

            <text x={BX} y={18} fontSize="10" fontWeight="700" fill="#826b3f" letterSpacing="1.6">BRONZE · raw</text>
            <text x={MX} y={18} fontSize="10" fontWeight="700" fill="#374151" letterSpacing="1.6">SILVER · conformed</text>
            <text x={RX} y={18} fontSize="10" fontWeight="700" fill="#7a5e2d" letterSpacing="1.6">GOLD · selected</text>

            {lin.edges.map((e, i) => {
              const a = nodeOf(e.from);
              const b = nodeOf(e.to);
              if (!a || !b) return null;
              const x1 = a.x + a.w, y1 = a.y + a.h / 2;
              const x2 = b.x,         y2 = b.y + b.h / 2;
              const mid = (x1 + x2) / 2;
              const d = `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
              return (
                <g key={i}>
                  <path d={d} fill="none" stroke="#FF694A" strokeWidth="1.6" strokeLinecap="round" markerEnd="url(#lin-arrow)" opacity="0.75" />
                  <circle r="2.5" fill="#FF694A">
                    <animateMotion dur={`${2.0 + i * 0.18}s`} repeatCount="indefinite" path={d} />
                    <animate attributeName="opacity" values="0;1;1;0" dur={`${2.0 + i * 0.18}s`} repeatCount="indefinite" />
                  </circle>
                  {e.tests && (
                    <g transform={`translate(${mid - 38}, ${(y1 + y2) / 2 - 8})`}>
                      <rect width="76" height="14" rx="3" fill="#FF694A" />
                      <text x="38" y="10" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#fff" letterSpacing="0.4">
                        {e.tests[0]}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {lin.bronze.map((t, i) => (
              <g key={t} transform={`translate(${BX}, ${bronzeY(i)})`}>
                <rect width={COL_W} height={ROW_H} rx="4" fill="#fbe9d5" stroke="#a05a2c" strokeWidth="1" />
                <text x="12" y="14" fontSize="9" fontWeight="800" fill="#7a3d0f" letterSpacing="1.4">BRONZE</text>
                <text x="12" y="28" fontSize="11" fontWeight="700" fill="#261810" fontFamily="ui-monospace, monospace">{t}</text>
              </g>
            ))}

            {lin.silver.map((t, i) => (
              <g key={t} transform={`translate(${MX}, ${silverY(i)})`}>
                <rect width={COL_W} height={ROW_H} rx="4" fill="#f4f4f3" stroke="#6b7280" strokeWidth="1" />
                <text x="12" y="14" fontSize="9" fontWeight="800" fill="#374151" letterSpacing="1.4">SILVER</text>
                <text x="12" y="28" fontSize="11" fontWeight="700" fill="#261810" fontFamily="ui-monospace, monospace">{t}</text>
              </g>
            ))}

            <g transform={`translate(${RX}, ${goldY})`}>
              <rect width={COL_W} height={ROW_H} rx="4" fill="#fbf2e6" stroke="#b87333" strokeWidth="2" />
              <text x="12" y="14" fontSize="9" fontWeight="800" fill="#7a4a1f" letterSpacing="1.4">GOLD</text>
              <text x="12" y="28" fontSize="11" fontWeight="700" fill="#261810" fontFamily="ui-monospace, monospace">{selected}</text>
            </g>
          </svg>
        </div>

        <div className="mt-4 flex items-center gap-4 text-[11px] text-[var(--ink-soft)] flex-wrap">
          <span className="inline-flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ background: '#FF694A' }} /> dbt transformation (auto-emitted)</span>
          <span>•</span>
          <span><strong className="text-[var(--espresso-deep)]">{lin.edges.length}</strong> column-level edges traced</span>
          <span>•</span>
          <span><strong className="text-[var(--espresso-deep)]">{lin.bronze.length + lin.silver.length + 1}</strong> dbt models in the lineage graph</span>
          <span>•</span>
          <span>Lineage runs at every build · zero manual upkeep</span>
        </div>
      </div>
    </section>
  );
}
