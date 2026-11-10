import Link from 'next/link';

const NotFound = () => (
  <main id="main" className="grid min-h-[100svh] place-items-center px-4">
    <div className="text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-crimson">ERR-404 · SIGNAL LOST</p>
      <h1 className="type-display mt-6 text-[clamp(4rem,16vw,14rem)]">404</h1>
      <Link href="/" className="mt-8 inline-block border border-line/40 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] hover:border-crimson hover:bg-crimson hover:text-obsidian">
        Return to base
      </Link>
    </div>
  </main>
);

export default NotFound;
