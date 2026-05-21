import { useJson } from '../data';

type Region = { region: string; stores: number; weekly_sales_avg_k: number; sss_growth_pct: number; drive_thru_med_s: number; labor_cost_pct: number; store_rating_avg: number };
type Store = { store_id: string; city: string; state: string; weekly_sales: number; throughput_oph: number; labor_cost_pct: number; drive_thru_med_s: number | null; rating: number };
type Locations = { regions: Region[]; top_50: Store[]; bottom_50: Store[] };

type Labor = {
  headcount_total: number;
  shift_fill_rate_pct: number;
  scheduling_compliance_pct: number;
  attrition_rate_annual_pct: number;
  employee_nps: number;
  labor_cost_pct_system: number;
  labor_cost_trend: { month: string; pct: number }[];
  forecast_vs_actual: { week: string; forecast_hours_k: number; actual_hours_k: number; variance_pct: number }[];
  attrition_by_region: { region: string; attrition_pct: number }[];
  staffing_agent_suggestions: { scope: string; stores_affected: number; action: string; expected_outcome: string; weekly_labor_delta_usd: number; weekly_revenue_delta_usd: number; confidence: string }[];
};

export default function OperationsPage() {
  const loc = useJson<Locations>('locations.json');
  const lab = useJson<Labor>('labor.json');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="eyebrow">Chief Restaurant Operations Officer view</div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--espresso-deep)]">Operations</h1>
        <p className="mt-2 text-[var(--ink-muted)] max-w-3xl leading-relaxed">
          Store-level operations across the 4,812-store fleet. Drive-thru speed, throughput, labor cost, and the staffing optimizer agent that proposes peak-hour adjustments.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="kpi-tile">
          <div className="kpi-tile-label">Headcount</div>
          <div className="kpi-tile-value tabular">{lab.data ? `${(lab.data.headcount_total / 1000).toFixed(1)}K` : '—'}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-tile-label">Labor cost (system)</div>
          <div className="kpi-tile-value tabular">{lab.data?.labor_cost_pct_system.toFixed(1) ?? '—'}%</div>
          <div className="kpi-tile-delta up">▼ -70 bps 6m</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-tile-label">Shift fill rate</div>
          <div className="kpi-tile-value tabular">{lab.data?.shift_fill_rate_pct.toFixed(1) ?? '—'}%</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-tile-label">Employee NPS</div>
          <div className="kpi-tile-value tabular">{lab.data?.employee_nps ?? '—'}</div>
          <div className="kpi-tile-delta up">+6 vs prior Q</div>
        </div>
      </section>

      <section className="research-card mb-10">
        <div className="research-card-header">
          <div className="eyebrow">Regional rollup</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Region performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--cream)] text-[var(--ink-soft)]">
              <tr>
                <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Region</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Stores</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Weekly sales avg</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">SSS growth</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Drive-thru median</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Labor %</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Rating</th>
              </tr>
            </thead>
            <tbody>
              {loc.data?.regions.map((r) => (
                <tr key={r.region} className="border-t border-[var(--hairline-soft)]">
                  <td className="px-4 py-2.5 font-serif font-semibold text-[var(--espresso-deep)]">{r.region}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular">{r.stores.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular">${r.weekly_sales_avg_k.toFixed(1)}K</td>
                  <td className={`px-4 py-2.5 text-right font-mono tabular ${r.sss_growth_pct >= 3 ? 'text-[var(--healthy)]' : r.sss_growth_pct >= 2 ? 'text-[var(--ink)]' : 'text-[var(--warn)]'}`}>+{r.sss_growth_pct.toFixed(1)}%</td>
                  <td className={`px-4 py-2.5 text-right font-mono tabular ${r.drive_thru_med_s > 220 ? 'text-[var(--alert)]' : r.drive_thru_med_s > 200 ? 'text-[var(--warn)]' : 'text-[var(--ink)]'}`}>{r.drive_thru_med_s}s</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular">{r.labor_cost_pct.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular">{r.store_rating_avg.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="research-card mb-10" style={{ borderColor: 'var(--copper)' }}>
        <div className="research-card-header flex items-center justify-between">
          <div>
            <div className="eyebrow" style={{ color: 'var(--copper-dim)' }}>Staffing optimizer · live</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Peak-hour staffing recommendations</h2>
          </div>
          <span className="status-pill copper">Cortex Agent</span>
        </div>
        <div className="p-5 space-y-4">
          {lab.data?.staffing_agent_suggestions.map((s) => (
            <article key={s.scope} className="p-4 rounded-md border border-[var(--hairline)] bg-[var(--paper)]">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h3 className="font-serif text-lg font-semibold text-[var(--espresso-deep)]">{s.scope}</h3>
                <span className={`status-pill ${s.confidence === 'high' ? 'healthy' : 'neutral'}`}>{s.confidence} confidence</span>
              </div>
              <p className="mt-2 text-sm text-[var(--ink)]"><strong className="text-[var(--espresso-deep)]">Action:</strong> {s.action}</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)] leading-relaxed">Expected outcome: {s.expected_outcome}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[12px] font-mono">
                <div className="px-3 py-1.5 rounded-md bg-[var(--cream-deep)]">stores: <span className="text-[var(--espresso-deep)] font-semibold">{s.stores_affected}</span></div>
                <div className={`px-3 py-1.5 rounded-md ${s.weekly_labor_delta_usd >= 0 ? 'bg-[var(--warn-bg)]' : 'bg-[var(--healthy-bg)]'}`}>labor Δ/wk: <span className="font-semibold">{s.weekly_labor_delta_usd >= 0 ? '+' : ''}${(s.weekly_labor_delta_usd / 1000).toFixed(1)}K</span></div>
                <div className="px-3 py-1.5 rounded-md bg-[var(--healthy-bg)]">revenue Δ/wk: <span className="text-[var(--healthy)] font-semibold">{s.weekly_revenue_delta_usd >= 0 ? '+' : ''}${(s.weekly_revenue_delta_usd / 1000).toFixed(0)}K</span></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="research-card">
          <div className="research-card-header">
            <div className="eyebrow">Top 15 stores · weekly sales</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Highest performers</h2>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--cream)] text-[var(--ink-soft)] sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Store</th>
                  <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Sales</th>
                  <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">OPH</th>
                  <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">DT med</th>
                </tr>
              </thead>
              <tbody>
                {loc.data?.top_50.map((s) => (
                  <tr key={s.store_id} className="border-t border-[var(--hairline-soft)]">
                    <td className="px-4 py-2">
                      <div className="font-mono text-[12px] text-[var(--espresso-deep)]">{s.store_id}</div>
                      <div className="text-[11px] text-[var(--ink-muted)]">{s.city}, {s.state}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular">${(s.weekly_sales / 1000).toFixed(1)}K</td>
                    <td className="px-4 py-2 text-right font-mono tabular">{s.throughput_oph}</td>
                    <td className="px-4 py-2 text-right font-mono tabular">{s.drive_thru_med_s ?? '—'}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="research-card">
          <div className="research-card-header">
            <div className="eyebrow">Bottom 10 stores · attention needed</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Lowest performers</h2>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--cream)] text-[var(--ink-soft)] sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Store</th>
                  <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Sales</th>
                  <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Labor</th>
                  <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">DT med</th>
                </tr>
              </thead>
              <tbody>
                {loc.data?.bottom_50.map((s) => (
                  <tr key={s.store_id} className="border-t border-[var(--hairline-soft)]">
                    <td className="px-4 py-2">
                      <div className="font-mono text-[12px] text-[var(--espresso-deep)]">{s.store_id}</div>
                      <div className="text-[11px] text-[var(--ink-muted)]">{s.city}, {s.state}</div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular">${(s.weekly_sales / 1000).toFixed(1)}K</td>
                    <td className="px-4 py-2 text-right font-mono tabular text-[var(--alert)]">{s.labor_cost_pct.toFixed(1)}%</td>
                    <td className="px-4 py-2 text-right font-mono tabular text-[var(--alert)]">{s.drive_thru_med_s ?? '—'}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="research-card mb-10">
        <div className="research-card-header">
          <div className="eyebrow">Workforce</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Forecast vs actual hours · last 7 weeks</h2>
        </div>
        <div className="p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[var(--ink-soft)]">
              <tr>
                <th className="text-left pb-2 text-[11px] uppercase tracking-wider font-semibold">Week</th>
                <th className="text-right pb-2 text-[11px] uppercase tracking-wider font-semibold">Forecast (Kh)</th>
                <th className="text-right pb-2 text-[11px] uppercase tracking-wider font-semibold">Actual (Kh)</th>
                <th className="text-right pb-2 text-[11px] uppercase tracking-wider font-semibold">Variance</th>
              </tr>
            </thead>
            <tbody>
              {lab.data?.forecast_vs_actual.map((w) => (
                <tr key={w.week} className="border-t border-[var(--hairline-soft)]">
                  <td className="py-2 font-mono text-[var(--espresso-deep)]">{w.week}</td>
                  <td className="py-2 text-right font-mono tabular">{w.forecast_hours_k.toLocaleString()}</td>
                  <td className="py-2 text-right font-mono tabular">{w.actual_hours_k.toLocaleString()}</td>
                  <td className={`py-2 text-right font-mono tabular ${Math.abs(w.variance_pct) > 2 ? 'text-[var(--warn)]' : 'text-[var(--healthy)]'}`}>{w.variance_pct >= 0 ? '+' : ''}{w.variance_pct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
