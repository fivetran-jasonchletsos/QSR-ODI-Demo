import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

// Nav refresh, ported from Clarity / Altavest. Three clusters:
//   1. Persona links (Home + QSR operations pages)
//   2. dbt-Wizard ▾ — narrative dropdown (Scenario / Live / Outcome)
//   3. ODI ▾ — plumbing dropdown (Architecture / Pipeline / Policy / About)
// Dark espresso-on-cream header — matches the Hearth brand without copying
// the FinServ navy. No ThemeToggle.

type NavEntry =
  | { kind: 'link'; to: string; label: string }
  | { kind: 'group'; label: string; matchPrefixes: string[]; children: { to: string; label: string }[] };

const NAV: NavEntry[] = [
  { kind: 'link', to: '/',           label: 'Home' },
  { kind: 'link', to: '/operations', label: 'Operations' },
  { kind: 'link', to: '/mobile',     label: 'Mobile + Loyalty' },
  { kind: 'link', to: '/menu',       label: 'Menu' },
  {
    kind: 'group',
    label: 'dbt-Wizard',
    matchPrefixes: ['/dbt-wizard'],
    children: [
      { to: '/dbt-wizard/scenario', label: 'Scenario' },
      { to: '/dbt-wizard/live',     label: 'Live build' },
      { to: '/dbt-wizard/outcome',  label: 'Outcome' },
    ],
  },
  {
    kind: 'group',
    label: 'ODI',
    matchPrefixes: ['/architecture', '/pipeline', '/policy', '/about'],
    children: [
      { to: '/architecture', label: 'Architecture' },
      { to: '/pipeline',     label: 'Pipeline' },
      { to: '/policy',       label: 'Policy' },
      { to: '/about',        label: 'About' },
    ],
  },
];

const NAV_FLAT: { to: string; label: string }[] = NAV.flatMap((e) =>
  e.kind === 'link' ? [{ to: e.to, label: e.label }] : e.children.map((c) => ({ to: c.to, label: `${e.label} · ${c.label}` })),
);

const DEMOS = [
  { key: 'tax-assessment',  name: 'Allegheny County Tax', industry: 'Public sector · Property assessment',          url: 'https://fivetran-jasonchletsos.github.io/tax-assessment-databricks-demo/', accent: '#dc2626' },
  { key: 'healthcare',      name: 'Clarity Health',       industry: 'Healthcare · Clinical analytics',              url: 'https://fivetran-jasonchletsos.github.io/Healthcare-EPIC-Snowflake-Demo/', accent: '#0d9488' },
  { key: 'finserv',         name: 'Altavest Capital',     industry: 'Financial Services · Wealth & banking',        url: 'https://fivetran-jasonchletsos.github.io/FinServ-ODI-Demo/', accent: '#1d4ed8' },
  { key: 'insurance',       name: 'Verity Insurance',     industry: 'Insurance · Policies, claims, reinsurance',    url: 'https://fivetran-jasonchletsos.github.io/Insurance-ODI-Demo/', accent: '#0369a1' },
  { key: 'qsr',             name: 'Hearth Coffee Co.',    industry: 'QSR · 4,800 stores, POS, supply, loyalty',     url: 'https://fivetran-jasonchletsos.github.io/QSR-ODI-Demo/', accent: '#b87333' },
  { key: 'media',           name: 'Lighthouse Media',     industry: 'Media · Audience intelligence',                url: 'https://fivetran-jasonchletsos.github.io/Media-ODI-Demo/', accent: '#7c3aed' },
  { key: 'retail',          name: 'Storefront Analytics', industry: 'Retail & e-commerce',                          url: 'https://fivetran-jasonchletsos.github.io/RetailEcom-ODI-Demo/', accent: '#ea580c' },
  { key: 'techsaas',        name: 'SaaS Pulse',           industry: 'Tech · SaaS analytics',                        url: 'https://fivetran-jasonchletsos.github.io/TechSaaS-ODI-Demo/', accent: '#059669' },
  { key: 'supplychain',     name: 'Manifest',             industry: 'Supply chain · Logistics',                     url: 'https://fivetran-jasonchletsos.github.io/SupplyChain-ODI-Demo/', accent: '#0891b2' },
  { key: 'lifesci',         name: 'Cohort',               industry: 'Life sciences · Clinical research',            url: 'https://fivetran-jasonchletsos.github.io/LifeSci-ODI-Demo/', accent: '#be185d' },
  { key: 'mission-control', name: 'Mission Control',      industry: 'Admin · Governance + observability',           url: 'https://fivetran-jasonchletsos.github.io/ODI-Mission-Control/', accent: '#22d3ee' },
];
const CURRENT_DEMO = 'qsr';

function NavEntryEl({ entry, pathname }: { entry: NavEntry; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (entry.kind === 'link') {
    return (
      <NavLink
        to={entry.to}
        end={entry.to === '/'}
        className={({ isActive }) =>
          `relative px-2.5 py-2 font-medium tracking-tight transition-colors text-[13px] whitespace-nowrap ${
            isActive ? 'text-[var(--copper-bright)]' : 'text-white/80 hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {entry.label}
            {isActive && (
              <span className="absolute left-2.5 right-2.5 -bottom-[1px] h-[2px]" style={{ background: 'var(--copper)' }} />
            )}
          </>
        )}
      </NavLink>
    );
  }

  const isActive = entry.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname === p);
  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`relative px-2.5 py-2 font-medium tracking-tight transition-colors text-[13px] whitespace-nowrap inline-flex items-center gap-1 ${
          isActive ? 'text-[var(--copper-bright)]' : 'text-white/80 hover:text-white'
        }`}
      >
        {entry.label}
        <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 4 L5 7 L8 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {isActive && (
          <span className="absolute left-2.5 right-5 -bottom-[1px] h-[2px]" style={{ background: 'var(--copper)' }} />
        )}
      </button>
      {open && (
        <span role="menu" className="absolute left-0 top-full mt-1 min-w-[200px] rounded-sm border border-white/15 shadow-xl overflow-hidden z-50" style={{ background: 'var(--espresso-deep)' }}>
          {entry.children.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              end={c.to === '/'}
              className={({ isActive: ia }) =>
                `block px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  ia
                    ? 'bg-white/10 text-[var(--copper-bright)]'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {c.label}
            </NavLink>
          ))}
        </span>
      )}
    </span>
  );
}

function DemoSwitcher() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Switch demo"
        className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border transition-colors bg-[var(--copper)]/20 text-[var(--copper-bright)] border-[var(--copper)]/40 hover:bg-[var(--copper)]/30"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--copper-bright)] animate-pulse" />
        Snapshot
        <svg viewBox="0 0 24 24" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-[280px] rounded-sm border border-[var(--hairline)] bg-white shadow-xl z-40 overflow-hidden"
        >
          <div className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)] border-b border-[var(--hairline)]">
            Switch demo
          </div>
          <div className="py-1">
            {DEMOS.map((d) => {
              const current = d.key === CURRENT_DEMO;
              const inner = (
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.accent }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--espresso-deep)] truncate">{d.name}</div>
                    <div className="text-[11px] text-[var(--ink-muted)] truncate">{d.industry}</div>
                  </div>
                  {current && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-[var(--cream-deep)] text-[var(--copper-dim)] border border-[var(--hairline)]">
                      Current
                    </span>
                  )}
                </div>
              );
              return current ? (
                <div key={d.key} className="opacity-60 cursor-default">{inner}</div>
              ) : (
                <a
                  key={d.key}
                  href={d.url}
                  className="block hover:bg-[var(--cream)] transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {inner}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream)]">
      <div className="brand-rail" />

      {/* Dark espresso header — Hearth brand, dark variant of the FinServ pattern */}
      <header className="sticky top-0 z-30 text-white" style={{ background: 'var(--espresso-deep)' }}>
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between gap-2 sm:gap-6">
            <Link to="/" className="flex items-center gap-3 shrink-0 min-w-0 group">
              <div className="h-10 w-10 rounded-sm flex items-center justify-center" style={{ background: 'var(--copper)' }}>
                <LogoMark className="h-6 w-6" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="font-serif font-semibold text-lg sm:text-xl tracking-tight truncate">
                  Hearth Coffee Co.
                </div>
                <div className="mt-0.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--copper-bright)]">
                  ODI Operations Portal
                </div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5 text-sm ml-auto">
              {NAV.map((entry) => (
                <NavEntryEl key={entry.kind === 'link' ? entry.to : entry.label} entry={entry} pathname={location.pathname} />
              ))}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <DemoSwitcher />
              <button
                type="button"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-sm text-white/80 hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  {mobileOpen ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /> : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="lg:hidden pb-4 border-t border-white/10 pt-3 space-y-3">
              <nav className="grid grid-cols-2 gap-1 text-sm">
                {NAV_FLAT.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-sm text-center font-medium border ${
                        isActive
                          ? 'bg-[var(--copper)] text-[var(--espresso-deep)] border-[var(--copper)]'
                          : 'border-white/15 text-white/80 hover:bg-white/10'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
              <div className="pt-3 border-t border-white/10">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--copper-bright)] mb-2">
                  Switch demo
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {DEMOS.map((d) => {
                    const current = d.key === CURRENT_DEMO;
                    const inner = (
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.accent }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-white truncate">{d.name}</div>
                          <div className="text-[11px] text-white/55 truncate">{d.industry}</div>
                        </div>
                        {current && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-[var(--copper)]/20 text-[var(--copper-bright)] border border-[var(--copper)]/40">
                            Current
                          </span>
                        )}
                      </div>
                    );
                    return current ? (
                      <div key={d.key} className="px-3 py-2 rounded-sm border border-white/15 opacity-70">
                        {inner}
                      </div>
                    ) : (
                      <a
                        key={d.key}
                        href={d.url}
                        className="px-3 py-2 rounded-sm border border-white/15 hover:bg-white/10 block"
                      >
                        {inner}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--hairline)] bg-[var(--paper)] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="text-xs text-[var(--ink-muted)] leading-relaxed">
            <span className="font-serif font-semibold text-[var(--espresso-deep)]">Hearth Coffee Co.</span> is a fictional QSR chain. Synthetic data only. Reference build for the Fivetran Open Data Infrastructure pattern.
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="layer-chip bronze">Bronze</span>
            <span className="layer-chip silver">Silver</span>
            <span className="layer-chip gold">Gold</span>
            <a
              href={`${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/Hearth-QSR-3min-Demo-Runbook.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors hover:bg-[var(--cream-deep)]"
              style={{ color: 'var(--copper-dim)', borderColor: 'var(--hairline)' }}
            >
              3-min Runbook
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 40 40" aria-hidden className={className}>
      <path d="M11 14h15a4 4 0 0 1 0 8h-1v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V14z" fill="#faf6ee" />
      <path d="M25 16h1a2 2 0 0 1 0 4h-1v-4z" fill="#3c2817" />
      <path d="M16 7c0 1.5 1 1.8 1 3.2 0 1-.4 1.4-.4 1.8M20 7c0 1.5 1 1.8 1 3.2 0 1-.4 1.4-.4 1.8M24 7c0 1.5 1 1.8 1 3.2 0 1-.4 1.4-.4 1.8" stroke="#3c2817" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
