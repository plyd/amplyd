# ADR-0002 — Split: Vercel for the frontend, GCP Cloud Run for the agent

- Status: Accepted
- Date: 2026-04-27

## Context

We could host both on Vercel (Edge/Node Functions) or both on Cloud Run.
We deliberately split them.

## Decision

- **Frontend**: Next.js 15 on Vercel. SSR, ISR, free CDN, native AI SDK
  streaming, KV for rate limiting.
- **Agent**: FastAPI + LangGraph in a distroless container on GCP Cloud
  Run (eu-west1), behind `mcp.amplyd.com`.
- Frontend `/api/chat` proxies SSE to the Cloud Run agent.

## Why

1. Demonstrates real cloud architecture skill with GCP — visible artifact
   for recruiters.
2. Keeps the LangGraph Python ecosystem first-class. Best agent tooling
   lives there (LangFuse, MCP SDK, litellm).
3. Decouples scale concerns: viral spikes on the static site don't touch
   the agent budget; the agent has its own observability surface.
4. Keeps Vercel bills predictable: heavy LLM calls live on Cloud Run with
   their own quota and Secret Manager.

## Consequences

- Two deploy pipelines; managed via Terraform on GCP and Vercel's
  Git-integrated deploys for the web app.
- Cross-origin call requires CORS + a shared `AGENT_API_TOKEN` for
  light authentication of the proxy.
- Adds ~50–150ms latency vs. co-located deploy. Acceptable; mitigated by
  Cloud Run min-instances and SSE streaming first chunk.
