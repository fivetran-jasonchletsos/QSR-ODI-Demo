import { useState } from 'react';
import { useJson } from '../data';

type Connector = {
  name: string;
  source: string;
  status: 'ok' | 'warn' | 'alert';
  rows_24h: number;
  freshness_min: number;
  tables: number;
  lineage: string;
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
                  className="mt-4 px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--copper)] text-[var(--copper-dim)] hover:bg-[var(--copper-bg)] transition-colors"
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
