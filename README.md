# Snacks Republic by PJRB — POS + Customer Storefront

Current status: specification and brainstorming stage; application code has not been scaffolded. The requested stack is React + Vite + Tailwind CSS, a TypeScript backend, and MySQL managed through MySQL Workbench.

Brand direction and advertised menu content are now documented from eight user-supplied images in [the brand reference](docs/brand/BRAND_REFERENCE.md): pink/cream gingham, red/yellow branding, and a food-and-drink catalog covering silog meals, kanto foods, noodles, sandwiches, and drinks.

Confirmed beverage focus: fruity soda, with flavor and size selection. The storefront will lead with fruity soda imagery and retain the pictured food categories.

## Run the local demo

1. Run `npm install`.
2. Start an isolated MySQL 8 instance, then run `node scripts/setup-local.mjs` once. This creates `.env`, applies migrations, seeds clearly labeled demo stock, exports the Workbench schema, and creates a local administrator. It does not overwrite an existing `.env`.
3. Run `npm run dev` and open `http://127.0.0.1:5173/`. Staff workspace: `/staff`. Local credentials are written to `.runtime/demo-access.txt` and are ignored by Git.

Useful checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`, and `npm run build`.

The demo seed deliberately uses illustrative stock and generated campaign imagery. Replace recipes, ingredients, prices, contact details, hours, and payment configuration before accepting real orders. Use [docs/database/schema.sql](docs/database/schema.sql) and [docs/database/ER_DIAGRAM.md](docs/database/ER_DIAGRAM.md) with MySQL Workbench.

Read [the updated system specification](docs/SYSTEM_SPEC.md) for technical requirements and [the brainstorming proposal](docs/BRAINSTORM.md) for review findings, proposed features, visual direction, and open decisions. The development workflow below is the original project setup; its framework examples are superseded by the updated specification.

## Original development setup

This repo is set up to be developed with Claude Code using a small team of specialized subagents instead of one general-purpose assistant. The goal: wireframe → UI/UX → database design → working system, done in a way that stays easy to extend, easy to debug, and easy to hand off to another developer later.

## How it fits together

```
docs/SYSTEM_SPEC.md   ← the single source of truth (architecture, DB schema, design system, decisions log)
.claude/agents/        ← one file per specialist (orchestrator, architect, backend, frontend, qa, reviewer, devops)
.claude/rules/         ← standards every agent follows (coding, security, testing)
.claude/workflows/     ← the step-by-step process for a feature, a bugfix, or a release
src/                   ← the actual application code, one folder per module
```

`docs/SYSTEM_SPEC.md` is the file that answers "what IS this system." Every agent reads it before doing anything, and it's meant to be updated as the project grows — not written once and forgotten.

## Getting started

1. **Fill in the basics first.** Open `docs/SYSTEM_SPEC.md` and fill in section 1 (Project Overview) and section 2 (Tech Stack). Everything else can be built up feature by feature.
2. **Start with the orchestrator.** For any new request — a feature, a bug, a release — ask for the `orchestrator` agent (in Claude Code: `@orchestrator` or "use the orchestrator agent to..."). It reads the spec, picks the right workflow from `.claude/workflows/`, and delegates to the right specialists in order.
3. **Don't call `backend`/`frontend` directly for anything non-trivial.** Going through `orchestrator` is what keeps `docs/SYSTEM_SPEC.md` and the changelog accurate — skipping it is how specs quietly go stale.

## Why this structure

- **Reusable for future developers:** one module = one folder (`.claude/rules/coding.md`), and the schema/contracts/design system live in one document instead of in someone's head.
- **Bugs are easy to isolate:** strict layering (view → controller → service → model → DB) plus layer-tagged error logs mean a bug can usually be pinned to one layer before anyone starts guessing.
- **Assets are easy to swap:** all image/icon/font/config paths resolve from one place (`docs/SYSTEM_SPEC.md` §8–9, owned by `devops`), so changing an asset source or environment is a config edit, not a code hunt.
- **Flexible for whatever comes next:** the agents and rules describe a process and a set of principles, not a specific framework — the Tech Stack table in `docs/SYSTEM_SPEC.md` is the only place the actual stack is pinned down, so the same setup works whether the project changes frontend framework, backend language, or hosting later.

## Optional next step

If you want Claude Code to automatically load project context every session without being asked, consider adding a `CLAUDE.md` at the project root that just says: *"Before doing anything, read docs/SYSTEM_SPEC.md."* This repo doesn't include one by default so the structure stays exactly as planned, but it's a one-file addition if you want it.
