import { NavLink, Outlet } from 'react-router-dom';

const NAV: { to: string; label: string }[] = [
  { to: '/', label: 'Home' },
  { to: '/operations', label: 'Operations' },
  { to: '/mobile', label: 'Mobile + Loyalty' },
  { to: '/menu', label: 'Menu' },
  { to: '/dbt-wizard/scenario', label: 'dbt-wizard' },
  { to: '/architecture', label: 'Architecture' },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/policy', label: 'Policy' },
  { to: '/about', label: 'About' },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 border-[var(--hairline)] bg-[var(--paper)]/95 backdrop-blur sticky top-0 z-30">
        <div className="brand-rail" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <LogoMark />
            <div className="leading-tight">
              <div className="font-serif text-[1.15rem] font-bold text-[var(--espresso-deep)] tracking-tight">Hearth Coffee Co.</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--copper-dim)] font-semibold">ODI Operations Portal</div>
            </div>
          </NavLink>
          <nav className="hidden md:flex items-center gap-1 ml-2 flex-1 overflow-x-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[var(--copper-bg)] text-[var(--espresso-deep)] font-bold ring-1 ring-[var(--copper)]/40 shadow-sm'
                      : 'text-[var(--ink-muted)] hover:text-[var(--espresso-deep)] hover:bg-[var(--cream-deep)]'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-2 ml-auto">
            <span className="status-pill healthy">Pipeline live</span>
            <span className="text-[11px] text-[var(--ink-soft)] font-mono">v0.1.0</span>
          </div>
        </div>
        <div className="md:hidden border-t border-[var(--hairline)] bg-[var(--cream)] overflow-x-auto">
          <div className="px-4 py-2 flex gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `px-2.5 py-1 text-xs rounded-md whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--copper-bg)] text-[var(--espresso-deep)] font-semibold'
                      : 'text-[var(--ink-muted)]'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
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

function LogoMark() {
  return (
    <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden>
      <defs>
        <linearGradient id="lgcup" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#5a3d28" />
          <stop offset="1" stopColor="#3c2817" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="9" fill="url(#lgcup)" />
      <path d="M11 14h15a4 4 0 0 1 0 8h-1v3a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V14z" fill="#faf6ee" />
      <path d="M25 16h1a2 2 0 0 1 0 4h-1v-4z" fill="#3c2817" />
      <path d="M16 7c0 1.5 1 1.8 1 3.2 0 1-.4 1.4-.4 1.8M20 7c0 1.5 1 1.8 1 3.2 0 1-.4 1.4-.4 1.8M24 7c0 1.5 1 1.8 1 3.2 0 1-.4 1.4-.4 1.8" stroke="#b87333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
