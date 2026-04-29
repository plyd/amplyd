import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { auth } from '@/auth';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { parseCvView } from '@/lib/cvView';
import { pickPresetForMessage } from '@/lib/cvViewPresets';

export const runtime = 'nodejs';

/**
 * Placeholder chat endpoint for M3. The real LangGraph agent backs this in
 * M5 (frontend ↔ agent SSE) — this milestone only validates the plumbing:
 *
 *   1. Auth.js v5 session resolution (sign-in optional).
 *   2. Sliding-window rate limit on KV (anon: 30/5min, user: 200/1h).
 *   3. AI SDK v6 UI message stream compatible with `useChat`.
 *
 * The placeholder reply intentionally introduces itself as the AI agent
 * (per the brief: panel is "Contact Vincent"; the AI identity is revealed
 * on the first reply) and asks for the info needed to reach Vincent.
 */

const MessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']),
  // AI SDK v6 sends an array of parts; the first is usually `{ type: 'text', text }`.
  parts: z
    .array(
      z.object({
        type: z.string(),
        text: z.string().optional(),
      }),
    )
    .optional(),
  content: z.string().optional(),
});

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  // `useChat` may include arbitrary extra fields; tolerate them.
  id: z.string().optional(),
});

function lastUserText(messages: z.infer<typeof MessageSchema>[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role !== 'user') continue;
    if (m.parts?.length) {
      const text = m.parts
        .filter((p) => p.type === 'text' && typeof p.text === 'string')
        .map((p) => p.text)
        .join(' ')
        .trim();
      if (text) return text;
    }
    if (typeof m.content === 'string' && m.content.trim()) return m.content.trim();
  }
  return '';
}

function detectLocale(req: Request): 'fr' | 'en' {
  const accept = req.headers.get('accept-language') ?? '';
  if (accept.toLowerCase().startsWith('fr')) return 'fr';
  // Heuristic via referer (e.g. `/fr/...`)
  const referer = req.headers.get('referer') ?? '';
  if (/\/fr(\/|$)/.test(referer)) return 'fr';
  return 'en';
}

function placeholderReply(opts: {
  locale: 'fr' | 'en';
  userName: string | null;
  userMessage: string;
}): string {
  const greeting = opts.userName ? `, ${opts.userName.split(' ')[0]}` : '';
  if (opts.locale === 'fr') {
    return [
      `Bonjour${greeting} — je suis l'agent IA de Vincent (et oui, c'est bien une IA qui vous répond).`,
      `Pour transmettre votre message à Vincent, j'aurais besoin de quelques infos :`,
      `• votre nom et votre société,`,
      `• un email ou un numéro où il peut vous joindre,`,
      `• le contexte (mission, poste, ou simple échange).`,
      `Le vrai agent arrive en M5 — pour l'instant je ne fais que confirmer la réception : « ${opts.userMessage} »`,
    ].join('\n\n');
  }
  return [
    `Hi${greeting} — I'm Vincent's AI agent (yes, an AI is replying here).`,
    `To pass your message along to Vincent, I'll need a few things:`,
    `• your name and company,`,
    `• an email or phone where he can reach you,`,
    `• a bit of context (mission, role, or just a chat).`,
    `The real agent ships in M5 — for now I'm only confirming receipt of: "${opts.userMessage}"`,
  ].join('\n\n');
}

export async function POST(req: Request) {
  // 1) Parse & validate
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  // 2) Resolve session (sign-in optional)
  const session = await auth();
  const userEmail = session?.user?.email ?? null;
  const userName = session?.user?.name ?? null;

  // 3) Rate-limit
  const identifier = userEmail ?? getClientIp(req);
  const rl = await checkRateLimit({ identifier, authenticated: Boolean(userEmail) });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'rate_limited' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Remaining': String(rl.remaining),
          'X-RateLimit-Reset': String(rl.reset),
          'Retry-After': String(Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))),
        },
      },
    );
  }

  // 4) Build placeholder reply
  const locale = detectLocale(req);
  const userMessage = lastUserText(parsed.data.messages) || '(message vide)';
  const reply = placeholderReply({ locale, userName, userMessage });

  // 5) Pick a CvView preset based on keywords in the user message. The real
  //    LangGraph agent (M6) will replace this with a model-driven choice; for
  //    now this is enough to drive the overlay end-to-end.
  //
  //    Re-validate through parseCvView so a typo in the preset table can't
  //    leak past the schema — the same guard the client applies on receipt.
  const preset = pickPresetForMessage(userMessage);
  const cvView = preset ? parseCvView(preset) : null;

  // 6) Stream as AI SDK UI message chunks
  const messageId = crypto.randomUUID();
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: 'text-start', id: messageId });
      // Stream in small chunks to feel agentic.
      const tokens = reply.match(/.{1,12}/gs) ?? [reply];
      for (const t of tokens) {
        writer.write({ type: 'text-delta', id: messageId, delta: t });
        await new Promise((r) => setTimeout(r, 18));
      }
      writer.write({ type: 'text-end', id: messageId });

      // Emit the CvView after the text so it lands as a separate part on the
      // assistant message; the order is irrelevant for correctness but feels
      // natural for any human reading the SSE stream.
      if (cvView) {
        writer.write({ type: 'data-cv-view', data: cvView });
      }
    },
    onError: () => 'stream_error',
  });

  return createUIMessageStreamResponse({ stream });
}
