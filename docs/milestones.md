# Milestone log

Append-only build log. One paragraph per milestone end.

## M1 — Bootstrap (in progress)

Initialised the monorepo: PNPM 10 workspace + Turborepo, MIT licence,
bilingual READMEs (`README.md`, `README.fr.md`), `.gitignore`/`.editorconfig`/
`.prettierrc.json`, root `package.json` with `setup-content` postinstall hook.

Established the **fork-safe content split**: real CV data lives in the
gitignored `apps/web/content/` directory locally; the public template is
`apps/web/content.example/`. Vincent's actual brief, Notion exports, and
secrets stay in the gitignored `_private/` directory at the repo root.

Scaffolded `apps/web` (Next.js 15 App Router, Tailwind v4, next-intl FR/EN
routing, design tokens from brief §6, placeholder hero, smoke test, ESLint,
Vitest) and `apps/agent` (Python 3.12 via uv, FastAPI, LangGraph deps stub,
`/health` + `/chat` SSE placeholder endpoint, distroless multi-stage
Dockerfile, ruff + mypy strict + pytest with 70% coverage gate). Wired up
GitHub Actions: `web-ci.yml`, `agent-ci.yml`, `deploy-agent.yml` (tagged
release → Artifact Registry → Cloud Run via Workload Identity Federation).
