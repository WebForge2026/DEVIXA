import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { CMS_TAG } from '@/lib/admin/content';
import { MAX_SLOT_IMAGES, editablePaths, mediaSlots } from '@/lib/admin/fields';
import { noStore, requireAdmin } from '@/lib/admin/session';
import { getStore } from '@/lib/admin/store';
import { locales } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

const slotIds = mediaSlots.map((s) => s.id) as [string, ...string[]];
const MAX_IMAGE_CHARS = 1_600_000; // ≈ 1.2 MB binary per image (images are compressed in the browser)

const textsSchema = z
  .record(z.string(), z.string().max(2000))
  .refine((record) => Object.keys(record).every((key) => editablePaths.has(key)), 'unknown field');

const contentSchema = z.object({
  texts: z.object(Object.fromEntries(locales.map((l) => [l, textsSchema.optional()]))),
  media: z
    .array(
      z.object({
        id: z.string().uuid(),
        slot: z.enum(slotIds),
        src: z.string().max(MAX_IMAGE_CHARS).regex(/^(data:image\/(webp|jpeg|png);base64,|https:\/\/)/),
        alt: z.string().max(200),
        updatedAt: z.string().max(40),
      }),
    )
    .max(mediaSlots.length * MAX_SLOT_IMAGES),
  theme: z.object({
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    cardRadius: z.number().min(0).max(24),
    glow: z.number().min(0).max(0.4),
    sphereRed: z.number().min(0.05).max(0.45),
  }),
});

export const GET = async () => {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const store = getStore();
  return NextResponse.json({ content: await store.getContent(), store: { kind: store.kind, persistent: store.persistent } }, noStore);
};

export const PUT = async (request: NextRequest) => {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const parsed = contentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
  const perSlot = new Map<string, number>();
  for (const item of parsed.data.media) {
    perSlot.set(item.slot, (perSlot.get(item.slot) ?? 0) + 1);
    if ((perSlot.get(item.slot) ?? 0) > MAX_SLOT_IMAGES) return NextResponse.json({ error: 'too many images' }, { status: 400 });
  }
  const content = { ...parsed.data, updatedAt: new Date().toISOString() };
  try {
    await getStore().saveContent(content);
  } catch (error) {
    console.error('[admin] content save failed', error);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
  // Publish: drop the cached content and re-render the public pages.
  revalidateTag(CMS_TAG);
  revalidatePath('/[locale]', 'layout');
  return NextResponse.json({ ok: true, updatedAt: content.updatedAt });
};
