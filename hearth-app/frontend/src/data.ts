// Synthetic data loader. All Hearth Coffee Co. data is invented for
// demo purposes. Files live under /public/data and are fetched at
// runtime so the SPA stays static-hostable on GitHub Pages.

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export async function loadJson<T>(name: string): Promise<T> {
  const url = `${BASE}/data/${name}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to load ${url}: ${r.status}`);
  return r.json() as Promise<T>;
}

import { useEffect, useState } from 'react';

export function useJson<T>(name: string): { data: T | null; error: string | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadJson<T>(name)
      .then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e) => { if (alive) setError(String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [name]);
  return { data, error, loading };
}

export function fmtMoney(v: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  }
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
export function fmtPct(v: number, digits = 1): string {
  return `${v >= 0 ? '' : ''}${v.toFixed(digits)}%`;
}
export function fmtNum(v: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  }
  return v.toLocaleString('en-US');
}
