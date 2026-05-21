import { useJson } from '../data';

type Sku = { sku: string; name: string; category: string; ytd_revenue: number; units_m: number; contrib_margin_pct: number };
type Change = { name: string; launched: string; impact_pct_units: number; impact_pct_margin: number; note: string };
type Reg = { region: string; highlight_sku: string; index_vs_national: number; note: string };
type Rec = { title: string; rationale: string; owner_role: string };
type Menu = { top_skus: Sku[]; recent_changes: Change[]; regional_variations: Reg[]; agent_recommendations: Rec[] };

type Supply = {
  green_bean_origin_mix: { origin: string; share_pct: number; varietal: string; spot_price_usd_lb: number; yoy_pct: number }[];
  commodity_exposure_m: { commodity: string; fy_spend_m: number; hedged_pct: number; unhedged_at_risk_m: number }[];
  risk_flags: { id: string; severity: string; title: string; summary: string; owner: string; exposure_m: number; action: string }[];
};

export default function MenuPage() {
  const m = useJson<Menu>('menu.json');
  const s = useJson<Supply>('supply_chain.json');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="eyebrow">Menu performance + sourcing</div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--espresso-deep)]">Menu</h1>
        <p className="mt-2 text-[var(--ink-muted)] max-w-3xl leading-relaxed">
          SKU performance, contribution margin, recent menu changes, regional variations, and the green-bean sourcing posture that feeds it all.
        </p>
      </header>

      <section className="research-card mb-10">
        <div className="research-card-header">
          <div className="eyebrow">Top 20 SKUs · YTD revenue</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Menu leaderboard</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--cream)] text-[var(--ink-soft)]">
              <tr>
                <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">SKU</th>
                <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Name</th>
                <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Category</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">YTD revenue</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Units</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Contrib. margin</th>
              </tr>
            </thead>
            <tbody>
              {m.data?.top_skus.map((sku) => (
                <tr key={sku.sku} className="border-t border-[var(--hairline-soft)]">
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[var(--espresso-deep)]">{sku.sku}</td>
                  <td className="px-4 py-2.5 font-serif font-semibold text-[var(--espresso-deep)]">{sku.name}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-muted)]">{sku.category}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular">${(sku.ytd_revenue / 1e6).toFixed(1)}M</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular">{sku.units_m.toFixed(1)}M</td>
                  <td className={`px-4 py-2.5 text-right font-mono tabular ${sku.contrib_margin_pct >= 70 ? 'text-[var(--healthy)]' : sku.contrib_margin_pct >= 60 ? 'text-[var(--ink)]' : 'text-[var(--warn)]'}`}>{sku.contrib_margin_pct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="research-card">
          <div className="research-card-header">
            <div className="eyebrow">Recent menu changes</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Launches + retirements · 12mo</h2>
          </div>
          <div className="p-5 space-y-3">
            {m.data?.recent_changes.map((c) => (
              <article key={c.name} className="p-3 rounded-md border border-[var(--hairline)] bg-[var(--paper)]">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <h3 className="font-serif text-base font-semibold text-[var(--espresso-deep)]">{c.name}</h3>
                  <span className="font-mono text-[11px] text-[var(--ink-soft)]">{c.launched}</span>
                </div>
                <div className="mt-1 flex gap-3 text-[12px] font-mono">
                  <span className={c.impact_pct_units >= 0 ? 'text-[var(--healthy)]' : 'text-[var(--alert)]'}>units: {c.impact_pct_units >= 0 ? '+' : ''}{c.impact_pct_units.toFixed(1)}%</span>
                  <span className={c.impact_pct_margin >= 0 ? 'text-[var(--healthy)]' : 'text-[var(--alert)]'}>margin: {c.impact_pct_margin >= 0 ? '+' : ''}{c.impact_pct_margin.toFixed(1)}%</span>
                </div>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">{c.note}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="research-card">
          <div className="research-card-header">
            <div className="eyebrow">Regional variations</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">What sells where</h2>
          </div>
          <div className="p-5 space-y-3">
            {m.data?.regional_variations.map((r) => (
              <article key={r.region} className="p-3 rounded-md border border-[var(--hairline)] bg-[var(--paper)]">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <h3 className="font-serif text-base font-semibold text-[var(--espresso-deep)]">{r.region}</h3>
                  <span className="font-mono text-[12px] text-[var(--copper-dim)] font-semibold">{r.index_vs_national.toFixed(2)}x national</span>
                </div>
                <div className="mt-1 text-sm text-[var(--ink)]"><strong className="text-[var(--espresso-deep)]">{r.highlight_sku}</strong></div>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">{r.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="research-card mb-10" style={{ borderColor: 'var(--copper)' }}>
        <div className="research-card-header">
          <div className="eyebrow" style={{ color: 'var(--copper-dim)' }}>Pricing agent · live</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Menu + price recommendations</h2>
        </div>
        <div className="p-5 space-y-3">
          {m.data?.agent_recommendations.map((r) => (
            <article key={r.title} className="p-4 rounded-md border border-[var(--hairline)] bg-[var(--paper)]">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h3 className="font-serif text-lg font-semibold text-[var(--espresso-deep)]">{r.title}</h3>
                <span className="status-pill copper">{r.owner_role}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">{r.rationale}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="research-card mb-10">
        <div className="research-card-header">
          <div className="eyebrow">Green-bean sourcing</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Origin mix + price exposure</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--cream)] text-[var(--ink-soft)]">
              <tr>
                <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Origin</th>
                <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Varietal</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Share</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Spot $/lb</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">YoY</th>
              </tr>
            </thead>
            <tbody>
              {s.data?.green_bean_origin_mix.map((o) => (
                <tr key={o.origin} className="border-t border-[var(--hairline-soft)]">
                  <td className="px-4 py-2.5 font-serif font-semibold text-[var(--espresso-deep)]">{o.origin}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-muted)]">{o.varietal}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular">{o.share_pct.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular">${o.spot_price_usd_lb.toFixed(2)}</td>
                  <td className={`px-4 py-2.5 text-right font-mono tabular ${o.yoy_pct > 10 ? 'text-[var(--alert)]' : o.yoy_pct > 5 ? 'text-[var(--warn)]' : 'text-[var(--ink)]'}`}>+{o.yoy_pct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <div className="eyebrow">Supply-chain risk flags</div>
        <h2 className="font-serif text-2xl font-semibold text-[var(--espresso-deep)] mb-3">Active threats to plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {s.data?.risk_flags.map((f) => (
            <article key={f.id} className="research-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`status-pill ${f.severity === 'alert' ? 'alert' : 'warn'}`}>{f.severity}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-semibold">{f.owner}</span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-[var(--espresso-deep)] leading-snug">{f.title}</h3>
              <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">{f.summary}</p>
              <div className="mt-3 px-3 py-2 rounded-md bg-[var(--cream-deep)] border border-[var(--hairline)] text-[12px] font-mono">
                <span className="text-[var(--ink-soft)]">exposure:</span> <span className="text-[var(--espresso-deep)] font-semibold">${f.exposure_m.toFixed(1)}M</span>
              </div>
              <p className="mt-2 text-sm text-[var(--ink)]"><strong className="text-[var(--espresso-deep)]">Action:</strong> {f.action}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
