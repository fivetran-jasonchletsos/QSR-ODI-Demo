import { useJson, fmtNum } from '../data';

type Mobile = {
  dau: number;
  mau: number;
  stickiness_pct: number;
  app_order_share_pct: number;
  app_order_share_trend: { week: string; pct: number }[];
  payment_mix: { method: string; share_pct: number }[];
  feature_adoption_pct: { feature: string; adoption_pct: number }[];
  promo_uplift: { promo: string; uplift_pct: number; audience_m: number; redeem_rate_pct: number }[];
  conversion_funnel: { step: string; rate_pct: number }[];
  regional_conversion: { region: string; conv_pct: number; delta_pp: number }[];
  loyalty_agent_recommendations: { segment: string; size_k: number; next_best_offer: string; expected_conv_lift_pp: number; rationale: string }[];
};

type Loyalty = {
  members_total: number;
  active_30d_pct: number;
  tiers: { tier: string; members_m: number; share_pct: number; avg_visits_30d: number; avg_ticket: number }[];
  points_liability_m_usd: number;
  redemption_rate_pct: number;
  top_promotions_ytd: { promo: string; redemptions_k: number; incremental_revenue_m: number; tier_skew: string }[];
  cohort_retention: { cohort: string; m6_retention_pct: number; m12_retention_pct: number | null; m18_retention_pct: number | null }[];
  churn_risk_segments: { segment: string; members_k: number; expected_loss_m: number }[];
};

export default function MobilePage() {
  const m = useJson<Mobile>('mobile.json');
  const l = useJson<Loyalty>('loyalty.json');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <div className="eyebrow">Chief Digital Officer view</div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--espresso-deep)]">Mobile + Loyalty</h1>
        <p className="mt-2 text-[var(--ink-muted)] max-w-3xl leading-relaxed">
          Hearth App moves 31.8% of orders and gates 28.3M loyalty members. The loyalty agent reads the member lifecycle gold table and proposes next-best offers by segment.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="kpi-tile">
          <div className="kpi-tile-label">DAU</div>
          <div className="kpi-tile-value tabular">{m.data ? fmtNum(m.data.dau, { compact: true }) : '—'}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-tile-label">MAU</div>
          <div className="kpi-tile-value tabular">{m.data ? fmtNum(m.data.mau, { compact: true }) : '—'}</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-tile-label">Stickiness</div>
          <div className="kpi-tile-value tabular">{m.data?.stickiness_pct.toFixed(1) ?? '—'}%</div>
          <div className="kpi-tile-delta flat">DAU / MAU</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-tile-label">App order share</div>
          <div className="kpi-tile-value tabular">{m.data?.app_order_share_pct.toFixed(1) ?? '—'}%</div>
          <div className="kpi-tile-delta down">▼ -1.6 pp 7w</div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="research-card">
          <div className="research-card-header">
            <div className="eyebrow">Funnel</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Mobile-order conversion funnel</h2>
          </div>
          <div className="p-5 space-y-2">
            {m.data?.conversion_funnel.map((s, i, arr) => {
              const dropoff = i === 0 ? 0 : arr[i - 1].rate_pct - s.rate_pct;
              return (
                <div key={s.step}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-[var(--ink)]">{s.step}</span>
                    <span className="font-mono text-sm text-[var(--espresso-deep)] tabular">{s.rate_pct.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 h-3 rounded-full bg-[var(--cream-deep)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.rate_pct}%`, background: i === arr.length - 1 ? 'linear-gradient(90deg, var(--healthy), #4caf78)' : 'linear-gradient(90deg, var(--copper-dim), var(--copper-bright))' }}
                    />
                  </div>
                  {i > 0 && dropoff > 0 && (
                    <div className="text-[11px] text-[var(--ink-soft)] mt-0.5 font-mono">drop-off: -{dropoff.toFixed(1)} pp</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="research-card">
          <div className="research-card-header">
            <div className="eyebrow">Region · last 7 days</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">App conversion by region</h2>
          </div>
          <div className="p-5">
            <table className="w-full text-sm">
              <thead className="text-[var(--ink-soft)]">
                <tr>
                  <th className="text-left pb-2 text-[11px] uppercase tracking-wider font-semibold">Region</th>
                  <th className="text-right pb-2 text-[11px] uppercase tracking-wider font-semibold">Conv</th>
                  <th className="text-right pb-2 text-[11px] uppercase tracking-wider font-semibold">Δ pp</th>
                </tr>
              </thead>
              <tbody>
                {m.data?.regional_conversion.map((r) => (
                  <tr key={r.region} className="border-t border-[var(--hairline-soft)]">
                    <td className="py-2.5 text-[var(--ink)]">{r.region}</td>
                    <td className="py-2.5 text-right font-mono tabular text-[var(--espresso-deep)]">{r.conv_pct.toFixed(1)}%</td>
                    <td className={`py-2.5 text-right font-mono tabular ${r.delta_pp >= 0 ? 'text-[var(--healthy)]' : 'text-[var(--alert)]'}`}>{r.delta_pp >= 0 ? '+' : ''}{r.delta_pp.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="research-card">
          <div className="research-card-header">
            <div className="eyebrow">Payment mix</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">How members check out</h2>
          </div>
          <div className="p-5 space-y-3">
            {m.data?.payment_mix.map((p) => (
              <div key={p.method}>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--ink)]">{p.method}</span>
                  <span className="font-mono text-[var(--espresso-deep)] tabular">{p.share_pct.toFixed(1)}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-[var(--cream-deep)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.share_pct * 2.4}%`, background: 'linear-gradient(90deg, var(--espresso-soft), var(--copper))' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="research-card">
          <div className="research-card-header">
            <div className="eyebrow">App feature adoption</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">What members actually use</h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {m.data?.feature_adoption_pct.map((f) => (
              <div key={f.feature} className="p-3 rounded-md bg-[var(--cream)] border border-[var(--hairline-soft)]">
                <div className="text-[11px] text-[var(--ink-soft)] uppercase tracking-wider font-semibold">{f.feature}</div>
                <div className="text-xl font-serif font-semibold text-[var(--espresso-deep)] tabular mt-1">{f.adoption_pct.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="research-card mb-10" style={{ borderColor: 'var(--copper)' }}>
        <div className="research-card-header flex items-center justify-between">
          <div>
            <div className="eyebrow" style={{ color: 'var(--copper-dim)' }}>Loyalty agent · live</div>
            <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Next-best-offer recommendations by segment</h2>
          </div>
          <span className="status-pill copper">Agent</span>
        </div>
        <div className="p-5 space-y-4">
          {m.data?.loyalty_agent_recommendations.map((r) => (
            <article key={r.segment} className="p-4 rounded-md border border-[var(--hairline)] bg-[var(--paper)]">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h3 className="font-serif text-lg font-semibold text-[var(--espresso-deep)]">{r.segment}</h3>
                <span className="text-[12px] font-mono text-[var(--ink-muted)] tabular">{r.size_k.toLocaleString()}K members</span>
              </div>
              <div className="mt-2 flex items-start gap-2">
                <span className="status-pill copper shrink-0">Offer</span>
                <p className="text-[var(--ink)] text-sm leading-relaxed">{r.next_best_offer}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--ink-muted)] leading-relaxed">{r.rationale}</p>
              <div className="mt-2 text-[12px] font-mono text-[var(--healthy)]">Expected conversion lift: +{r.expected_conv_lift_pp.toFixed(1)} pp</div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="kpi-tile">
          <div className="kpi-tile-label">Hearth Rewards members</div>
          <div className="kpi-tile-value tabular">{l.data ? fmtNum(l.data.members_total, { compact: true }) : '—'}</div>
          <div className="kpi-tile-delta up">{l.data?.active_30d_pct.toFixed(1)}% active 30d</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-tile-label">Points liability</div>
          <div className="kpi-tile-value tabular">${l.data?.points_liability_m_usd.toFixed(1)}M</div>
          <div className="kpi-tile-delta flat">Redemption rate {l.data?.redemption_rate_pct.toFixed(1)}%</div>
        </div>
        <div className="kpi-tile">
          <div className="kpi-tile-label">Tiers</div>
          <div className="mt-1 space-y-1.5">
            {l.data?.tiers.map((t) => (
              <div key={t.tier} className="flex justify-between text-[13px]">
                <span className="font-semibold text-[var(--espresso-deep)]">{t.tier}</span>
                <span className="font-mono tabular text-[var(--ink-muted)]">{t.share_pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="research-card mb-10">
        <div className="research-card-header">
          <div className="eyebrow">Loyalty promos · YTD</div>
          <h2 className="font-serif text-xl font-semibold text-[var(--espresso-deep)]">Top campaigns</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--cream)] text-[var(--ink-soft)]">
              <tr>
                <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Promotion</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Redemptions</th>
                <th className="text-right px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Incremental rev.</th>
                <th className="text-left px-4 py-2 text-[11px] uppercase tracking-wider font-semibold">Tier skew</th>
              </tr>
            </thead>
            <tbody>
              {l.data?.top_promotions_ytd.map((p) => (
                <tr key={p.promo} className="border-t border-[var(--hairline-soft)]">
                  <td className="px-4 py-2.5 font-serif font-semibold text-[var(--espresso-deep)]">{p.promo}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular">{p.redemptions_k.toLocaleString()}K</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular text-[var(--healthy)]">+${p.incremental_revenue_m.toFixed(1)}M</td>
                  <td className="px-4 py-2.5 text-[var(--ink-muted)]">{p.tier_skew}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
