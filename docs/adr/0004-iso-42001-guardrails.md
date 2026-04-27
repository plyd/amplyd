# ADR-0004 — ISO 42001-aligned guardrails on the agent

- Status: Accepted
- Date: 2026-04-27

## Context

The agent represents Vincent in front of recruiters. It must not lie,
hallucinate, leak personal contact information, quote a TJM, or reveal
client-confidential matter. ISO 42001 (AI management systems) emphasises
auditable controls, explicit non-disclosure, and traceable reasoning.

## Decision

Layered guardrails:

1. **Input filter** (`src/guardrails/input_filter.py`) — length cap (4000
   chars), regex/heuristic rejection of jailbreak vocabulary.
2. **Output filter** (`src/guardrails/output_filter.py`) — post-LLM regex
   pass scrubbing phone-like patterns, monetary amounts flagged as
   TJM/salary, listed confidential terms.
3. **Tool gating** — `reveal_phone` is unreachable until `qualify_lead`
   has stored a complete record (company, role, contract type, location).
4. **System prompt** with non-negotiable core rules in EN and FR.
5. **LangFuse tracing** for every step of every conversation, providing a
   tamper-resistant audit trail.
6. **Rate limiting** at 5 conversations / Google account / 24h via Vercel
   KV.

## Consequences

- Higher up-front engineering and a written policy. Worth it: the
  guardrails ARE the demonstration of competence.
- Every guardrail is unit-tested in `tests/unit/test_guardrails.py`.
- The "governance-iso-42001" article (drafted at M9, not published in V1)
  documents the controls publicly when the time is right.
