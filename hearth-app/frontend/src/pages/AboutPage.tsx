export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="research-card p-6 mb-10" style={{ borderColor: 'var(--copper)' }}>
        <div className="eyebrow mb-2" style={{ color: 'var(--copper-dim)' }}>The ODI Story</div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-[var(--espresso-deep)]">
          Data infrastructure for agents you trust.
        </h2>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed">
          <em>"MDS was optimized for humans. ODI is designed for a future with humans and
          production agents at scale."</em> This demo is one instance of that architecture:
          Fivetran's 750+ connectors and Managed Data Lake Service (MDLS) land data into open
          table formats; dbt transformations build the governed semantic layer; multiple compute
          engines and AI agents read the same gold tables.
        </p>
        <a
          href="https://fivetran-jasonchletsos.github.io/Fivetran-Demo-Repository/story/"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          style={{ color: 'var(--copper-dim)' }}
        >
          Read the full ODI Story →
        </a>
      </section>

      <header className="mb-8">
        <div className="eyebrow mb-1">ODI Reference Architecture</div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--espresso-deep)]">About Hearth Coffee Co.</h1>
        <p className="mt-3 text-[var(--ink-muted)] leading-relaxed">
          Hearth is a reference build that demonstrates how a national QSR chain runs operations,
          digital, supply chain, loyalty, and labor on a single Open Data Infrastructure stack.
          Fourteen source systems land into a customer-owned Apache Iceberg lake; dbt builds the
          governed semantic layer; Snowflake, Trino, and AI agents all read the same gold tables.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-semibold text-[var(--espresso-deep)] border-b border-[var(--hairline)] pb-2 mb-4">Why Hearth picked ODI</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="research-card p-5">
              <div className="layer-chip gold inline-flex mb-3">{p.tag}</div>
              <h3 className="font-serif text-lg font-semibold text-[var(--espresso-deep)]">{p.title}</h3>
              <p className="mt-1 text-sm text-[var(--ink-muted)] leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-semibold text-[var(--espresso-deep)] border-b border-[var(--hairline)] pb-2 mb-4">Tech stack</h2>
        <div className="research-card p-5">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {STACK.map((s) => (
              <li key={s.name} className="flex items-start gap-3">
                <div className="layer-chip silver shrink-0 mt-0.5">{s.layer}</div>
                <div className="min-w-0">
                  <div className="font-serif font-semibold text-[var(--espresso-deep)]">{s.name}</div>
                  <div className="text-xs text-[var(--ink-muted)]">{s.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl font-semibold text-[var(--espresso-deep)] border-b border-[var(--hairline)] pb-2 mb-4">ODI vs MDS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="research-card p-5">
            <div className="eyebrow mb-2">Traditional MDS</div>
            <h3 className="font-serif text-lg font-semibold text-[var(--espresso-deep)]">Warehouse-centric</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink-muted)]">
              <li>• Single proprietary warehouse owns storage <em>and</em> compute</li>
              <li>• Data exits via expensive egress and replication</li>
              <li>• Compute engine choice locked to vendor roadmap</li>
              <li>• Customer pays for storage twice (lake plus warehouse)</li>
              <li>• Schema evolution is vendor-managed</li>
            </ul>
          </div>
          <div className="research-card p-5" style={{ borderColor: 'var(--copper)' }}>
            <div className="eyebrow mb-2" style={{ color: 'var(--copper-dim)' }}>Open Data Infrastructure</div>
            <h3 className="font-serif text-lg font-semibold text-[var(--espresso-deep)]">Open lake-centric</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink)]">
              <li>• Customer owns the storage layer (S3 plus Iceberg)</li>
              <li>• Any compute engine — Snowflake, Trino, DuckDB, Spark</li>
              <li>• Catalog is open (Glue, Nessie, Polaris)</li>
              <li>• Pay once for storage; swap compute as workloads evolve</li>
              <li>• Schema evolution is in the Iceberg spec, vendor-neutral</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-md bg-[var(--cream-deep)] border border-[var(--hairline)] p-5 text-sm text-[var(--ink)]">
        <div className="eyebrow mb-2" style={{ color: 'var(--warn)' }}>Disclaimer</div>
        <p className="text-[var(--ink-muted)] leading-relaxed">
          <strong className="text-[var(--espresso-deep)]">All data shown is synthetic.</strong>{' '}
          Hearth Coffee Co. is a fictional 4,800-store QSR chain invented for this demo. No portion of this site represents real Starbucks, Dunkin&apos;, Tim Hortons, or any other operator&apos;s metrics, and no portion constitutes operational or investment advice.
        </p>
      </section>
    </div>
  );
}

const PILLARS = [
  {
    tag: 'Pillar 1',
    title: 'Customer-owned storage',
    body: 'All ingested data lands in Hearth\'s S3 bucket as Apache Iceberg tables. Fivetran writes; Hearth reads with any engine. No egress, no double-storage, no lock-in.',
  },
  {
    tag: 'Pillar 2',
    title: 'Open table format',
    body: 'Iceberg v2 provides ACID transactions, schema evolution, time-travel queries, and partition evolution. Toast POS, Olo, DoorDash, Workday — every source lands into the same table spec.',
  },
  {
    tag: 'Pillar 3',
    title: 'Any compute engine',
    body: 'Snowflake powers BI and agent workloads. Trino runs ad-hoc analyst queries. DuckDB powers laptop analysis. The loyalty agent and the staffing agent both read the same gold tables.',
  },
];

const STACK = [
  { layer: 'Ingest',     name: '14 Fivetran connectors', note: 'POS · ordering · delivery · loyalty · workforce · supply chain · reviews.' },
  { layer: 'Storage',    name: 'Amazon S3',              note: 'hearth-odi-lake bucket holds bronze · silver · gold · marts prefixes.' },
  { layer: 'Format',     name: 'Apache Iceberg v2',      note: 'Parquet files, ZSTD-compressed, Glue catalog (Polaris-ready).' },
  { layer: 'Catalog',    name: 'AWS Glue Data Catalog',  note: 'Iceberg REST, table-level RBAC, schema-evolution audit.' },
  { layer: 'Transform',  name: 'dbt',                    note: '282 tested models across bronze, silver, gold, marts.' },
  { layer: 'Query',      name: 'Snowflake (primary)',    note: 'Agents on the gold layer · BI workloads · sub-second on gold tables.' },
  { layer: 'Frontend',   name: 'React + Vite + Tailwind',note: 'Static SPA on GitHub Pages, reads the gold marts via Snowflake / Athena / Trino.' },
  { layer: 'Agents',     name: 'Loyalty + Staffing + Supply', note: 'Agents read member lifecycle, drive-thru speed, and commodity exposure gold tables.' },
];
