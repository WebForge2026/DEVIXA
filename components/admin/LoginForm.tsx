'use client';

import { Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { DxMark } from '@/components/ui/Wordmark';

const MESSAGES: Record<string, string> = {
  credentials: 'Email or password is incorrect.',
  rate: 'Too many attempts. Please wait 10 minutes.',
  disabled: 'Admin login is not configured on this server. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET.',
  network: 'Connection failed. Please try again.',
};

export const LoginForm = ({ next, enabled }: { next: string; enabled: boolean }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(enabled ? null : 'disabled');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        window.location.href = next;
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? 'network');
    } catch {
      setError('network');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#09090B] px-4 text-zinc-200">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DC2626]/15 blur-[120px]" />
      <form onSubmit={submit} className="relative w-full max-w-[380px] rounded-xl border border-zinc-800/80 bg-[#111114]/90 p-7 shadow-2xl backdrop-blur" noValidate>
        <div className="flex items-center justify-between">
          <DxMark id="dx-login" className="h-6 text-zinc-50" />
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            <Lock size={11} /> Restricted
          </span>
        </div>
        <h1 className="mt-6 text-lg font-semibold text-zinc-50">Command Center</h1>
        <p className="mt-1 text-[12px] text-zinc-500">Sign in to manage leads, statistics and content.</p>
        <label className="mt-6 block text-[12px] text-zinc-400" htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#0c0c0f] px-3 py-2.5 text-[13px] text-zinc-100 focus:border-zinc-600 focus:outline-none"
        />
        <label className="mt-4 block text-[12px] text-zinc-400" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#0c0c0f] px-3 py-2.5 text-[13px] text-zinc-100 focus:border-zinc-600 focus:outline-none"
        />
        {error ? (
          <p role="alert" className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
            {MESSAGES[error] ?? MESSAGES.network}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !email || !password || !enabled}
          className="mt-6 w-full rounded-md bg-[#DC2626] py-2.5 text-[13px] font-semibold text-white shadow-[0_0_30px_-8px_#DC2626] transition-colors hover:bg-red-500 disabled:opacity-40"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
};
