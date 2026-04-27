# Amplyd

> An AI-native, agentic CV. Open-source template you can fork and adapt.
> Production deployment lives at **[amplyd.com](https://amplyd.com)**.

[![web-ci](https://github.com/plyd/amplyd/actions/workflows/web-ci.yml/badge.svg)](https://github.com/plyd/amplyd/actions/workflows/web-ci.yml)
[![agent-ci](https://github.com/plyd/amplyd/actions/workflows/agent-ci.yml/badge.svg)](https://github.com/plyd/amplyd/actions/workflows/agent-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

🇫🇷 [Lire en français](./README.fr.md)

---

## What this is

Amplyd is a small, self-contained reference architecture for replacing a static
CV with an **AI agent recruiters can actually talk to** — without the agent
ever lying, leaking your phone number, or quoting your day rate.

- A bilingual one-page Next.js 15 site (FR / EN), MDX-authored via Fumadocs.
- A LangGraph agent on GCP Cloud Run with first-class tools:
  match a job description, qualify a recruiter, reveal contact info only after
  qualification, book a meeting via Cal.com.
- A public MCP server (read-only) so other AI agents can fetch the profile.
- Multi-provider LLM routing (Claude / GPT / Gemini) via litellm.
- LangFuse tracing on every step. ISO 42001-aligned guardrails.

## Architecture

```
amplyd.com (Vercel)               mcp.amplyd.com (GCP Cloud Run)
─────────────────────             ──────────────────────────────
Next.js 15 + Tailwind v4          FastAPI + LangGraph
shadcn/ui + Motion                StateGraph: route → retrieve → reason → tool → respond
Fumadocs (MDX + llms.txt)         Tools: search_profile, match_offer,
Auth.js v5 (Google OAuth)                qualify_lead, reveal_phone,
Vercel AI SDK 6 (useChat)                book_meeting, request_intro
next-intl (FR / EN)               Multi-provider via litellm
Vercel KV (rate limiting)         LangFuse tracing
                                  MCP server at /mcp
       │ POST /api/chat                ▲
       └────── SSE proxy ───────────────┘
```

## Repo layout

```
amplyd/
├── apps/
│   ├── web/          # Next.js 15 frontend (Vercel)
│   └── agent/        # LangGraph Python agent (Cloud Run)
├── infra/
│   └── terraform/    # Cloud Run + Artifact Registry + IAM
├── docs/
│   ├── adr/          # Architectural decision records
│   ├── architecture.md
│   └── milestones.md # Append-only build log
├── scripts/
│   └── setup-content.mjs  # Copies content.example/ → content/ on install
└── .github/workflows/
```

## Forking this — content safety

This repo ships **template / placeholder content only**. The author's real CV
data lives in a gitignored `apps/web/content/` directory locally.

If you fork:

1. Run `pnpm install` — `setup-content.mjs` copies
   `apps/web/content.example/` → `apps/web/content/` automatically.
2. Edit the MDX files in `apps/web/content/` with your own profile.
3. The `content/` directory stays gitignored, so your private data never lands
   on GitHub.

If you'd rather keep your content in version control, just remove the
`apps/web/content/` line from `.gitignore`. That's a personal choice.

## Quickstart

```bash
# Prereqs: node >= 20, pnpm 10, python 3.12, uv, docker, terraform 1.7+
git clone https://github.com/plyd/amplyd.git
cd amplyd
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Fill in keys (see apps/web/.env.example for the list)
pnpm dev
```

For the agent:

```bash
cd apps/agent
uv sync
cp .env.example .env
uv run uvicorn src.main:app --reload --port 8080
```

## Documentation

- [Architecture](./docs/architecture.md)
- [ADRs](./docs/adr/)
- [Milestone log](./docs/milestones.md)

## License

MIT — see [LICENSE](./LICENSE). Fork freely, build your own AI-native CV.
