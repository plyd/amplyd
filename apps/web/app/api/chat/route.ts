import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { auth } from '@/auth';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { parseCvView } from '@/lib/cvView';
import { pickPresetForMessage } from '@/lib/cvViewPresets';

export const runtime = 'nodejs';

const AGENT_BASE_URL = process.env.AGENT_BASE_URL?.replace(/\/+$/, '') ?? '';
const AGENT_API_TOKEN = process.env.AGENT_API_TOKEN ?? '';
const AGENT_TIMEOUT_MS = 30_000;

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

  // 4) Resolve locale + last-user-text once for both proxy and fallback.
  const locale = detectLocale(req);
  const userMessage = lastUserText(parsed.data.messages) || '(message vide)';

  // 5) Stream as AI SDK UI message chunks.
  //
  //    When AGENT_BASE_URL is set we proxy to the LangGraph agent and forward
  //    its SSE chunks 1:1 (same shape: text-start/text-delta/text-end/data-*).
  //    On error or timeout we fall back to the keyword-driven placeholder so
  //    the page never sees a blank assistant message.
  const messageId = crypto.randomUUID();
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      if (AGENT_BASE_URL) {
        const ok = await proxyToAgent({
          writer,
          messages: parsed.data.messages,
          locale,
        });
        if (ok) return;
        // fall through to placeholder
      }

      const reply = placeholderReply({ locale, userName, userMessage });
      const preset = pickPresetForMessage(userMessage);
      const cvView = preset ? parseCvView(preset) : null;

      writer.write({ type: 'text-start', id: messageId });
      const tokens = reply.match(/.{1,12}/gs) ?? [reply];
      for (const t of tokens) {
        writer.write({ type: 'text-delta', id: messageId, delta: t });
        await new Promise((r) => setTimeout(r, 18));
      }
      writer.write({ type: 'text-end', id: messageId });

      if (cvView) {
        writer.write({ type: 'data-cv-view', data: cvView });
      }
    },
    onError: () => 'stream_error',
  });

  return createUIMessageStreamResponse({ stream });
}

// ── Agent proxy ──────────────────────────────────────────────────────────────

type ChatPart = { type: string; text?: string };
type ChatMessage = z.infer<typeof MessageSchema>;
type StreamWriter = Parameters<
  NonNullable<Parameters<typeof createUIMessageStream>[0]['execute']>
>[0]['writer'];

/** Collapse a UI-message into the ``{role, content}`` shape the agent expects. */
function toAgentMessages(
  messages: ChatMessage[],
): { role: 'user' | 'assistant' | 'system'; content: string }[] {
  const out: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];
  for (const m of messages) {
    let content = '';
    if (m.parts?.length) {
      content = m.parts
        .filter((p: ChatPart) => p.type === 'text' && typeof p.text === 'string')
        .map((p: ChatPart) => p.text!)
        .join(' ')
        .trim();
    }
    if (!content && typeof m.content === 'string') content = m.content.trim();
    if (!content) continue;
    out.push({ role: m.role, content });
  }
  return out;
}

/**
 * Forward a chat call to the agent service and re-emit each SSE chunk to the
 * caller's UI message stream. Returns ``true`` if the proxy succeeded (status
 * 200 and at least one chunk forwarded), ``false`` to trigger the placeholder
 * fallback.
 */
async function proxyToAgent(opts: {
  writer: StreamWriter;
  messages: ChatMessage[];
  locale: 'fr' | 'en';
}): Promise<boolean> {
  const { writer, messages, locale } = opts;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AGENT_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (AGENT_API_TOKEN) headers.Authorization = `Bearer ${AGENT_API_TOKEN}`;

    const res = await fetch(`${AGENT_BASE_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages: toAgentMessages(messages), locale }),
      signal: ctrl.signal,
    });

    if (!res.ok || !res.body) {
      console.warn('[proxy] agent returned status', res.status);
      return false;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let forwarded = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by "\n\n".
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        for (const line of frame.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          try {
            const obj = JSON.parse(payload) as { type?: string; data?: unknown };
            if (!obj || typeof obj.type !== 'string') continue;
            if (obj.type === 'done' || obj.type === 'error') continue;
            if (obj.type === 'data-cv-view') {
              const view = parseCvView(obj.data);
              if (view) writer.write({ type: 'data-cv-view', data: view });
              continue;
            }
            // text-start / text-delta / text-end pass through unchanged.
            writer.write(obj as Parameters<StreamWriter['write']>[0]);
            forwarded++;
          } catch {
            // ignore malformed frames
          }
        }
      }
    }

    return forwarded > 0;
  } catch (err) {
    console.warn('[proxy] forward failed:', err);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
