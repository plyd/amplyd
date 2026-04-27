# Amplyd

> Un CV agentique, IA-native. Template open-source à forker et adapter.
> Déploiement en production : **[amplyd.com](https://amplyd.com)**.

[![web-ci](https://github.com/plyd/amplyd/actions/workflows/web-ci.yml/badge.svg)](https://github.com/plyd/amplyd/actions/workflows/web-ci.yml)
[![agent-ci](https://github.com/plyd/amplyd/actions/workflows/agent-ci.yml/badge.svg)](https://github.com/plyd/amplyd/actions/workflows/agent-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

🇬🇧 [Read in English](./README.md)

---

## C'est quoi

Amplyd est une petite architecture de référence, autonome, pour remplacer un
CV statique par **un agent IA avec qui les recruteurs peuvent vraiment
discuter** — sans que l'agent mente, ne lâche votre numéro de téléphone, ou
révèle votre TJM.

- Un site Next.js 15 monopage bilingue (FR / EN), contenu MDX via Fumadocs.
- Un agent LangGraph sur GCP Cloud Run avec des outils de premier niveau :
  matcher une offre, qualifier un recruteur, révéler le contact seulement
  après qualification, prendre un RDV via Cal.com.
- Un serveur MCP public (lecture seule) pour que d'autres agents IA puissent
  récupérer le profil.
- Routage multi-fournisseurs (Claude / GPT / Gemini) via litellm.
- Traces LangFuse sur chaque étape. Garde-fous ISO 42001-aligned.

## Architecture

```
amplyd.com (Vercel)               mcp.amplyd.com (GCP Cloud Run)
─────────────────────             ──────────────────────────────
Next.js 15 + Tailwind v4          FastAPI + LangGraph
shadcn/ui + Motion                StateGraph: route → retrieve → reason → tool → respond
Fumadocs (MDX + llms.txt)         Outils: search_profile, match_offer,
Auth.js v5 (Google OAuth)                  qualify_lead, reveal_phone,
Vercel AI SDK 6 (useChat)                  book_meeting, request_intro
next-intl (FR / EN)               Multi-providers via litellm
Vercel KV (rate limiting)         Traces LangFuse
                                  Serveur MCP sur /mcp
       │ POST /api/chat                ▲
       └────── SSE proxy ───────────────┘
```

## Forker — sécurité du contenu

Ce dépôt n'embarque **que du contenu template**. Les vraies données du CV de
l'auteur vivent localement dans `apps/web/content/`, qui est gitignoré.

Si vous forkez :

1. `pnpm install` — `setup-content.mjs` copie automatiquement
   `apps/web/content.example/` → `apps/web/content/`.
2. Éditez les MDX dans `apps/web/content/` avec votre profil.
3. `content/` reste gitignoré, vos données privées ne partent jamais sur
   GitHub.

Si vous préférez versionner votre contenu, retirez juste la ligne
`apps/web/content/` du `.gitignore`. Choix perso.

## Démarrage rapide

```bash
# Prérequis : node >= 20, pnpm 10, python 3.12, uv, docker, terraform 1.7+
git clone https://github.com/plyd/amplyd.git
cd amplyd
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

Pour l'agent :

```bash
cd apps/agent
uv sync
cp .env.example .env
uv run uvicorn src.main:app --reload --port 8080
```

## Licence

MIT — cf. [LICENSE](./LICENSE). Forkez librement, construisez votre propre
CV IA-native.
