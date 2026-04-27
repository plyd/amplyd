# Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         amplyd.com (Vercel)                         │
│                                                                     │
│   Next.js 15 App Router  +  Tailwind v4  +  shadcn/ui  +  Motion    │
│   Fumadocs (MDX content + llms.txt + content negotiation)           │
│   Auth.js v5 (Google OAuth)                                         │
│   Vercel AI SDK 6 (streaming UI, useChat hook)                      │
│   Vercel KV (rate limiting)                                         │
│   next-intl (FR/EN)                                                 │
│                                                                     │
│   POST /api/chat  ──────►  fetch SSE  ──────►  Cloud Run agent      │
│   POST /api/lead  ──────►  Resend     ──────►  vincent.juhel@...    │
│   GET  /these/... ──────►  static PDF (preserved from old site)     │
└─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│            mcp.amplyd.com (GCP Cloud Run, eu-west1)                 │
│                                                                     │
│   FastAPI + LangGraph Python agent                                  │
│   - StateGraph: route → retrieve → reason → tool → respond          │
│   - Tools: search_profile, match_offer, qualify_lead,               │
│     reveal_phone, book_meeting, request_intro                       │
│   - Multi-provider via litellm                                      │
│   - LangFuse tracing                                                │
│   - MCP server endpoint at /mcp (read-only profile)                 │
│                                                                     │
│   Secrets via GCP Secret Manager                                    │
│   IaC: Terraform (basic — Cloud Run + Artifact Registry + IAM)      │
└─────────────────────────────────────────────────────────────────────┘
```

See ADRs in [`adr/`](./adr/) for the rationale of each major choice.
