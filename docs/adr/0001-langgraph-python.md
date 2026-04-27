# ADR-0001 — LangGraph (Python) for the agent runtime

- Status: Accepted
- Date: 2026-04-27

## Context

The site needs a real agent — not a single LLM call. Recruiters ask
multi-step questions (match a JD, qualify, reveal contact, book meeting),
each requiring tool use, state persistence within a conversation, and
guardrails between steps.

Candidates considered:

1. **LangGraph (Python)** — explicit StateGraph, first-class tool nodes,
   typed state, mature streaming, broad ecosystem, LangFuse instrumented
   out of the box.
2. Vercel AI SDK 6 alone (Node) — excellent UI streaming and `useChat`,
   but agent orchestration is less expressive than a StateGraph.
3. LangChain Expression Language without LangGraph — flexible but less
   suited to multi-tool conditional flows.
4. A hand-rolled Python state machine — minimum dependencies but rebuilds
   what LangGraph already gives us (interrupts, checkpointing, replay).

## Decision

We use **LangGraph in Python** for the agent and **AI SDK 6** in the
frontend purely for the UI streaming layer. The two communicate over SSE.
The agent runs on GCP Cloud Run (see ADR-0002).

## Consequences

- We carry a Python service in a TS-heavy repo. Acceptable: it's the
  ecosystem where MCP, LangFuse, and tool composition are best supported,
  and it shows real cloud architecture skill.
- We need two CI pipelines (Node + Python). Done — `web-ci.yml` and
  `agent-ci.yml`.
- Cold-start cost on Cloud Run is non-zero but bounded by min-instances.
