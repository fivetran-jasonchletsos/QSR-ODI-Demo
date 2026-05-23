import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useJson } from '../data';

const FIVETRAN_BASE = 'https://fivetran.com/dashboard/connectors';
const FIVETRAN_DASHBOARD_URL = 'https://fivetran.com/dashboard/connections';

type Connector = {
  name: string;
  source: string;
  status: 'ok' | 'warn' | 'alert';
  rows_24h: number;
  freshness_min: number;
  tables: number;
  lineage: string;
  fivetran_id?: string;
  note?: string;
};
type Layer = {
  layer: 'bronze' | 'silver' | 'gold' | 'marts';
  rows_in: number;
  rows_out: number;
  tables: number;
  last_run_min_ago: number;
  status: 'ok' | 'running' | 'failed';
  tests_passed: number;
  tests_failed: number;
  tests_failed_note?: string;
};
type Scenario = { id: string; label: string; summary: string; impact: string };
type Pipe = { connectors: Connector[]; dbt_layers: Layer[]; failure_scenarios: Scenario[] };

export default function PipelinePage() {
  const p = useJson<Pipe>('pipeline.json');
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="eyebrow">Pipeline observability</div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--espresso-deep)]">Pipeline</h1>
        <p className="mt-2 text-[var(--ink-muted)] max-w-3xl leading-relaxed">
          Connector status, four dbt layers, and a failure simulator. Every connector here is labeled Fivetran in lineage because Fivetran is the single ingest control plane.
        </p>
      </header>

      <section className="research-card mb-10">
        <div className="research-card-header">
          <div className="eyebrow">Connectors · last 24h</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">14 sources · single ingest control plane</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--cream)] text-[var(--ink-soft)]">
              <tr>
                <th className="text-left px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Connector</th>
                <th className="text-left px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Source</th>
                <th className="text-left px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Status</th>
                <th className="text-right px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Rows 24h</th>
                <th className="text-right px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Freshness</th>
                <th className="text-right px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Tables</th>
                <th className="text-left px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Lineage</th>
                <th className="text-left px-4 py-2 font-semibold uppercase text-[11px] tracking-wider">Fivetran</th>
              </tr>
            </thead>
            <tbody>
              {p.data?.connectors.map((c) => (
                <tr key={c.name} className="border-t border-[var(--hairline-soft)]">
                  <td className="px-4 py-2.5">
                    <div className="font-serif font-semibold text-[var(--espresso-deep)]">{c.name}</div>
                    {c.note && <div className="text-[11px] text-[var(--warn)] mt-0.5">{c.note}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--ink-muted)]">{c.source}</td>
                  <td className="px-4 py-2.5"><span className={`status-pill ${c.status === 'ok' ? 'healthy' : c.status === 'warn' ? 'warn' : 'alert'}`}>{c.status}</span></td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] tabular">{c.rows_24h.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] tabular">{c.freshness_min}m</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] tabular">{c.tables}</td>
                  <td className="px-4 py-2.5"><span className="code-chip">{c.lineage}</span></td>
                  <td className="px-4 py-2.5">
                    {c.fivetran_id && (
                      <div className="flex flex-col gap-1">
                        <span className="code-chip text-[10px]">{c.fivetran_id}</span>
                        <a
                          href={`${FIVETRAN_BASE}/${c.fivetran_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-semibold text-[var(--copper-dim)] hover:underline whitespace-nowrap"
                        >
                          Open in Fivetran →
                        </a>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        {p.data?.dbt_layers.map((l) => (
          <div key={l.layer} className="kpi-tile">
            <div className="flex items-center justify-between">
              <span className={`layer-chip ${l.layer === 'marts' ? 'gold' : l.layer}`}>{l.layer}</span>
              <span className={`status-pill ${l.tests_failed === 0 ? 'healthy' : 'warn'}`}>{l.tests_failed === 0 ? 'green' : `${l.tests_failed} failing`}</span>
            </div>
            <div className="kpi-tile-value mt-2 tabular">{l.tables}</div>
            <div className="text-[11px] text-[var(--ink-soft)] uppercase tracking-wider font-semibold mt-1">tables</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-[var(--ink-muted)] font-mono">
              <div>in: <span className="text-[var(--espresso-deep)]">{(l.rows_in / 1e6).toFixed(1)}M</span></div>
              <div>out: <span className="text-[var(--espresso-deep)]">{(l.rows_out / 1e6).toFixed(1)}M</span></div>
              <div>tests: <span className="text-[var(--healthy)]">{l.tests_passed}✓</span></div>
              <div>ran: <span className="text-[var(--espresso-deep)]">{l.last_run_min_ago}m ago</span></div>
            </div>
            {l.tests_failed_note && (
              <div className="mt-2 text-[11px] text-[var(--warn)] leading-snug">{l.tests_failed_note}</div>
            )}
          </div>
        ))}
      </section>

      {/* dbt-wizard callout */}
      <section
        className="research-card p-5 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ borderLeft: '4px solid var(--copper)' }}
      >
        <div>
          <div className="eyebrow mb-1" style={{ color: 'var(--copper-dim)' }}>dbt-wizard · missing model demo</div>
          <div className="font-serif text-lg font-semibold text-[var(--espresso-deep)]">
            When a question has no gold table — build one in 90 seconds
          </div>
          <p className="text-sm text-[var(--ink-muted)] mt-0.5 max-w-2xl">
            COO asks: "Why did drive-thru lane speed slip 22 seconds at franchise stores Friday dinner?"
            No <span className="font-mono">gold.fct_dt_speed_by_ownership_daypart_daily</span> exists. Ops Sync meets in 6 hours.
            Four sub-agents author, test, and materialize the model live on screen.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/dbt-wizard/scenario"
            className="inline-flex items-center gap-2 rounded-md font-semibold px-5 py-2.5 text-white hover:opacity-95 transition-opacity whitespace-nowrap"
            style={{ background: 'var(--copper)' }}
          >
            See the scenario
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
          <a
            href={FIVETRAN_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--espresso-deep)] underline underline-offset-4 whitespace-nowrap"
          >
            All connectors in Fivetran →
          </a>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="eyebrow">Resilience</div>
            <h2 className="font-serif text-2xl font-semibold text-[var(--espresso-deep)]">Failure simulator</h2>
          </div>
          <span className="text-xs text-[var(--ink-soft)]">Sandbox runs against a frozen Iceberg snapshot</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {p.data?.failure_scenarios.map((s) => {
            const active = activeScenario === s.id;
            return (
              <article key={s.id} className={`research-card p-5 transition-shadow ${active ? 'shadow-md' : ''}`} style={active ? { borderColor: 'var(--copper)' } : undefined}>
                <h3 className="font-serif text-lg font-semibold text-[var(--espresso-deep)] leading-snug">{s.label}</h3>
                <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">{s.summary}</p>
                <div className="mt-3 px-3 py-2 rounded-md bg-[var(--cream-deep)] border border-[var(--hairline)]">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">Observed impact</div>
                  <div className="text-[13px] text-[var(--espresso-deep)] mt-0.5">{s.impact}</div>
                </div>
                <button
                  onClick={() => setActiveScenario(active ? null : s.id)}
                  className="mt-4 btn-copper"
                >
                  {active ? 'Reset' : 'Trigger simulation'}
                </button>
                {active && (
                  <div className="mt-3 text-[12px] text-[var(--healthy)] font-mono">
                    [sim] Scenario activated. Pipeline self-heals; downstream dashboards held at last-known-good values.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
