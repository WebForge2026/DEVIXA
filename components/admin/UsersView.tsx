import { useState, type FormEvent } from 'react';
import { api, useAdminData } from './hooks';

type User = { id: string; email: string; created_at: string };
type UsersResponse = { users: User[]; currentId: string };
const input = 'rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-400';
const button = 'rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50';

export const UsersView = () => {
  const { data, loading, error, reload } = useAdminData<UsersResponse>('/api/admin/users.php');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const change = async (body: object, ownPassword = false) => {
    setBusy(true); setMessage('');
    try {
      await api('/api/admin/users.php', { method: 'POST', body: JSON.stringify(body) });
      if (ownPassword) { window.location.href = '/admin/login'; return; }
      setEmail(''); setPassword(''); setEditing(null); setNewPassword('');
      await reload();
    } catch (e) {
      setMessage(e instanceof Error && e.message === '409' ? 'A user with this email already exists.' : 'Could not save the change. Check the fields and try again.');
    } finally { setBusy(false); }
  };
  const create = (event: FormEvent) => { event.preventDefault(); void change({ action: 'create', email, password }); };

  return <div className="max-w-4xl space-y-6">
    <p className="text-sm text-zinc-400">All users have full access to the admin panel. Passwords must be 12–72 bytes.</p>
    <form onSubmit={create} className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-800 bg-[#111114] p-4">
      <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-400">Email<input className={input} type="email" maxLength={254} required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-400">Password<input className={input} type="password" minLength={12} maxLength={72} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button className={button} disabled={busy}>Add user</button>
    </form>
    {message && <p role="alert" className="text-sm text-red-400">{message}</p>}
    {loading && <p className="text-sm text-zinc-400">Loading users…</p>}
    {error && <p role="alert" className="text-sm text-red-400">Could not load users.</p>}
    <div className="space-y-2">{data?.users.map((user) => <div key={user.id} className="rounded-lg border border-zinc-800 bg-[#111114] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-zinc-100">{user.email} {user.id === data.currentId && <span className="text-xs text-zinc-500">(you)</span>}</p><p className="mt-1 text-xs text-zinc-500">Added {user.created_at.slice(0, 10)}</p></div>
        <div className="flex gap-2"><button type="button" className={button} onClick={() => { setEditing(user.id); setNewPassword(''); }}>Change password</button>{user.id !== data.currentId && <button type="button" className={button} disabled={busy} onClick={() => { if (window.confirm(`Remove ${user.email}?`)) void change({ action: 'delete', id: user.id }); }}>Remove</button>}</div>
      </div>
      {editing === user.id && <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void change({ action: 'password', id: user.id, password: newPassword }, user.id === data.currentId); }}><input aria-label={`New password for ${user.email}`} className={input} type="password" minLength={12} maxLength={72} required autoComplete="new-password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /><button className={button} disabled={busy}>Save password</button><button type="button" className={button} onClick={() => setEditing(null)}>Cancel</button></form>}
    </div>)}</div>
  </div>;
};
