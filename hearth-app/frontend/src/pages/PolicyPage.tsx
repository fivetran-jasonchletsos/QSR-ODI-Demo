export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="eyebrow">Why this is hard</div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--espresso-deep)]">QSR data is fragmented by design</h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed max-w-3xl">
          A national quick-service restaurant operator runs nine kinds of system at once. Each was bought to solve one job, by one team, on its own timeline. The result is that the Chief Digital Officer and the Chief Restaurant Operations Officer cannot answer a single shared question without a multi-week project. ODI is the structural fix.
        </p>
      </header>

      <section className="research-card p-6 mb-8">
        <h2 className="font-serif text-2xl font-semibold text-[var(--espresso-deep)] mb-4">The nine fragments</h2>
        <ol className="space-y-4 text-sm text-[var(--ink)]">
          {FRAGMENTS.map((f, i) => (
            <li key={f.title} className="flex items-start gap-4">
              <span className="font-mono text-[11px] text-[var(--copper-dim)] font-bold pt-0.5 w-6 shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <div className="font-serif font-semibold text-[var(--espresso-deep)] text-base">{f.title}</div>
                <p className="mt-1 text-[var(--ink-muted)] leading-relaxed">{f.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="research-card p-6 mb-8" style={{ borderColor: 'var(--copper)' }}>
        <div className="eyebrow mb-2" style={{ color: 'var(--copper-dim)' }}>How ODI bridges it</div>
        <h2 className="font-serif text-2xl font-semibold text-[var(--espresso-deep)] mb-3">One lake. Many engines. Live agents.</h2>
        <ul className="space-y-3 text-sm text-[var(--ink)] leading-relaxed">
          <li className="flex gap-2"><span className="text-[var(--copper-dim)] font-bold">·</span><span><strong className="text-[var(--espresso-deep)]">Fivetran</strong> normalizes ingest from 14 different source schemas (POS, ordering, delivery, loyalty, workforce, supply, reviews) into Apache Iceberg tables on a Hearth-owned S3 bucket. No source-system team has to change anything.</span></li>
          <li className="flex gap-2"><span className="text-[var(--copper-dim)] font-bold">·</span><span><strong className="text-[var(--espresso-deep)]">dbt</strong> conforms 168 raw tables into 28 governed gold facts. A store-day, a member, a SKU, a shift — each entity has one definition, tested.</span></li>
          <li className="flex gap-2"><span className="text-[var(--copper-dim)] font-bold">·</span><span><strong className="text-[var(--espresso-deep)]">Iceberg</strong> means the schema is open. The CFO reads the same drive-thru fact table in Snowflake that the data scientist reads in DuckDB and the loyalty agent reads via the Cortex API.</span></li>
          <li className="flex gap-2"><span className="text-[var(--copper-dim)] font-bold">·</span><span><strong className="text-[var(--espresso-deep)]">Agents</strong> (loyalty next-best-offer, staffing optimizer, supply-chain risk) read gold and write decisions back. They are not separate apps with separate data — they are queries against the same lake.</span></li>
        </ul>
      </section>

      <section className="research-card p-6 mb-8">
        <h2 className="font-serif text-2xl font-semibold text-[var(--espresso-deep)] mb-3">What changes for the CDO and the COO</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-md border border-[var(--hairline)] bg-[var(--paper)]">
            <div className="eyebrow mb-1">Before ODI</div>
            <ul className="text-sm text-[var(--ink-muted)] space-y-2 leading-relaxed">
              <li>· Mobile-app conversion lives in Amplitude.</li>
              <li>· Drive-thru speed lives in Toast.</li>
              <li>· Labor cost lives in Kronos.</li>
              <li>· Coffee cost lives in Oracle ERP.</li>
              <li>· Cross-system question = ticket, ETL, two weeks.</li>
            </ul>
          </div>
          <div className="p-4 rounded-md border border-[var(--copper)] bg-[var(--copper-bg)]">
            <div className="eyebrow mb-1" style={{ color: 'var(--copper-dim)' }}>With ODI</div>
            <ul className="text-sm text-[var(--ink)] space-y-2 leading-relaxed">
              <li>· One <span className="code-chip">fct_store_day</span> table joins the four.</li>
              <li>· Drive-thru slowdown auto-correlates to mobile conversion.</li>
              <li>· Staffing agent fires the proposed fix without a ticket.</li>
              <li>· Coffee-cost spike triggers menu-pricing agent in same lake.</li>
              <li>· Cross-system question = SQL, twenty seconds.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

const FRAGMENTS = [
  { title: 'Point of sale',     body: 'Toast in new stores, NCR Aloha in legacy stores, Square in airport and pop-up locations. Three vendors, three schemas, three refund flows.' },
  { title: 'Mobile app + web',  body: 'Olo handles order-ahead and fulfillment. Snowplow captures product events. Two systems, two notions of what an "order" is.' },
  { title: 'Delivery partners', body: 'DoorDash, Uber Eats, and Grubhub each have their own marketplace data with their own commission structures and reporting cadences.' },
  { title: 'Loyalty + CRM',     body: 'Salesforce Marketing Cloud holds member identity and engagement journeys; the app holds session activity. Member 360 only exists in a slide deck.' },
  { title: 'Workforce',         body: 'Workday owns the worker master; Kronos owns the shift. Same employee appears in both with different IDs and different work-rule definitions.' },
  { title: 'Supply chain',      body: 'Coffee + Dairy ERP owns receipts; commodity hedges live in a separate treasury system. Store-level inventory lives in the POS. Three systems, three timestamps.' },
  { title: 'Reviews + rating',  body: 'Yelp, Google, and the in-app rating each tell a different story. None of them are joined to the operational fact table by default.' },
  { title: 'Marketing',         body: 'Email and push live in Salesforce. Paid social lives in agency dashboards. Attribution is a spreadsheet.' },
  { title: 'Finance',           body: 'NetSuite holds the GL. Same-store-sales growth is calculated in a different system from the one that calculates the comp basis.' },
];
