# DoraPocket Agent Instructions

## Project source of truth

- `README.md` is the source of truth for the product description, current capabilities, technology stack, project structure, runtime flow, and future direction.
- `Todo.md` is the only long-lived backlog. Add an item only when it has a clear outcome and acceptance condition.
- There is no permanent `IMPLEMENTATION_PLAN.md` or parallel documentation tree. Temporary plans belong in the conversation; durable follow-up work belongs in `Todo.md`.
- `.specstory/history` is local, auto-saved history. It is read-only context and is not a source of truth for the current implementation.

## Project facts

DoraPocket is a task-driven AI tool recommendation assistant. It helps a user narrow a concrete task to a tool worth trying first, then supports opening, saving, and evaluating that recommendation. It does not complete the task inside external tools.

The current stack is Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, React Three Fiber, Three.js, Zustand, TanStack Query, LangChain, Qwen, Prisma 7, PostgreSQL, Supabase Auth/Storage/Realtime, optional Aliyun speech services, and Vercel Cron.

Use the current code layout as the authority:

- `src/app`: routes, pages, and API handlers.
- `src/app/analyse`: analysis, clarification, recommendation, 3D stage, and voice interaction.
- `src/app/market`: tool market, search, submission, review, and pocket views.
- `src/app/profile`: user profile and settings.
- `src/components`: shared UI, providers, and cross-route components.
- `src/server`: server-only authentication, Agent logic, market services, repositories, retrieval, storage, webhooks, and cron jobs.
- `src/shared`: cross-layer types, domain rules, market/discovery logic, and user models.
- `src/lib`: client queries, Supabase clients, audio, speech, realtime, storage, and utilities.
- `src/store`: client application state.
- `prisma`: database schema and migrations.
- `public`: 3D models, images, audio, and browser worklets.

## Working rules

1. Read the relevant implementation and existing tests before changing behavior. Follow established patterns and verify assumptions against the repository.
2. Prefer small, explicit changes. Use composition and dependency injection where a boundary needs to be testable; avoid speculative abstractions.
3. For behavior changes, write or update deterministic tests first when practical. Test behavior and failure paths, not implementation details.
4. Handle errors at the correct boundary with descriptive context. Do not silently swallow exceptions or expose unnecessary internal error details to users.
5. Do not disable tests, bypass hooks with `--no-verify`, or use destructive Git commands unless the user explicitly requests that exact operation.
6. Preserve unrelated user changes. Do not modify `.specstory/history`, generated output, database data, or deployment state as part of ordinary repository work.
7. If the same issue fails after three distinct attempts, stop, record the concrete errors and alternatives, and reassess the approach before trying again.
8. Do not commit changes unless the user asks for a commit. Before handing off, inspect the diff and run proportional verification.

## Commands

The repository uses Yarn 1.22.22. Common commands are:

```bash
yarn dev
yarn build
yarn start
yarn lint
yarn typecheck
yarn prisma:generate
yarn prisma:migrate
```

For a documentation-only change, at minimum run `git diff --check` and audit links and file references. For code changes, run the affected tests plus `yarn typecheck` and `yarn lint`; run a production build when the change affects deployment or route compilation.

## Documentation policy

- Keep durable project knowledge in the three root documents only.
- Keep README claims aligned with the current code, not with old Specs, plans, or conversations.
- Keep TODO items actionable, prioritized, and verifiable. Move stable product direction to README instead of duplicating it in TODO.
- When a task is complete, remove or rewrite the corresponding TODO item rather than leaving a stale checklist.

## Definition of done

- The requested behavior or document content is implemented.
- Existing relevant tests pass; new behavior has appropriate coverage.
- TypeScript and lint checks pass when applicable.
- No stale paths, broken local links, accidental generated files, or unrelated changes remain.
- The final response states what changed and what verification was run.
