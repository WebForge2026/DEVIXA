import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { emptyContent, type ContentState, type Lead, type Presence, type TelemetryEvent } from '../types';
import type { AdminStore } from './types';

type FileData = { events: TelemetryEvent[]; presence: Record<string, Presence>; leads: Lead[]; content: ContentState };

const MAX_EVENTS = 200_000;
/** On Vercel only /tmp is writable — and it is wiped between instances, hence "not persistent". */
const onServerless = Boolean(process.env.VERCEL);
const FILE = onServerless ? '/tmp/devixa-admin-store.json' : path.join(process.cwd(), '.data', 'admin-store.json');

let cache: FileData | null = null;
let cacheMtime = 0;
let queue: Promise<unknown> = Promise.resolve();

const mtime = async () => {
  try {
    return (await stat(FILE)).mtimeMs;
  } catch {
    return 0;
  }
};

/**
 * Next.js bundles route handlers and server actions as separate module instances, each with its
 * own memory — so the cache is only reused while the file is unchanged on disk.
 */
const load = async (): Promise<FileData> => {
  const current = await mtime();
  if (cache && current === cacheMtime) return cache;
  cacheMtime = current;
  try {
    const parsed = JSON.parse(await readFile(FILE, 'utf8')) as Partial<FileData>;
    cache = {
      events: parsed.events ?? [],
      presence: parsed.presence ?? {},
      leads: parsed.leads ?? [],
      content: { ...emptyContent(), ...parsed.content },
    };
  } catch {
    cache = { events: [], presence: {}, leads: [], content: emptyContent() };
  }
  return cache;
};

/** Serialised read-modify-write with an atomic rename, so concurrent requests never corrupt the file. */
const mutate = (fn: (data: FileData) => void) => {
  const run = queue.then(async () => {
    const data = await load();
    fn(data);
    await mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(data));
    await rename(tmp, FILE);
    cacheMtime = await mtime();
  });
  queue = run.catch(() => undefined);
  return run;
};

export const createFileStore = (): AdminStore => ({
  kind: 'file',
  persistent: !onServerless,
  recordEvent: (event) =>
    mutate((d) => {
      d.events.push(event);
      if (d.events.length > MAX_EVENTS) d.events.splice(0, d.events.length - MAX_EVENTS);
    }),
  heartbeat: (presence) =>
    mutate((d) => {
      d.presence[presence.visitor] = presence;
      // Drop stale entries so the map stays small.
      const cutoff = Date.now() - 10 * 60_000;
      Object.entries(d.presence).forEach(([key, p]) => Date.parse(p.lastSeen) < cutoff && delete d.presence[key]);
    }),
  listEvents: async (since) => (await load()).events.filter((e) => Date.parse(e.createdAt) >= since.getTime()),
  listPresence: async (since) => Object.values((await load()).presence).filter((p) => Date.parse(p.lastSeen) >= since.getTime()),
  createLead: (lead) =>
    mutate((d) => {
      d.leads.push({ ...lead, id: randomUUID(), createdAt: new Date().toISOString(), status: 'new', notes: '' });
    }),
  listLeads: async () => [...(await load()).leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  updateLead: (kind, id, patch) =>
    mutate((d) => {
      const lead = d.leads.find((l) => l.id === id && l.kind === kind);
      if (!lead) throw new Error('Lead not found');
      Object.assign(lead, patch);
    }),
  getContent: async () => structuredClone((await load()).content),
  saveContent: (content) =>
    mutate((d) => {
      d.content = content;
    }),
});
