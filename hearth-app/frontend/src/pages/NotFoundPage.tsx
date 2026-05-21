import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <div className="eyebrow">404</div>
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-[var(--espresso-deep)] mt-1">Page not found</h1>
      <p className="mt-3 text-[var(--ink-muted)]">That route does not exist in this build of the Hearth Operations Portal.</p>
      <Link to="/" className="mt-6 inline-block px-4 py-2 rounded-md border border-[var(--copper)] text-[var(--copper-dim)] font-semibold hover:bg-[var(--copper-bg)]">Back to Home</Link>
    </div>
  );
}
