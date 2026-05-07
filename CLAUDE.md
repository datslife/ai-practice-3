# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Non-standard: two sub-projects live on separate git branches, checked out as worktrees under `.worktrees/`. There is a double-nesting — the npm root is one level deeper than the worktree root:

```
.worktrees/backend/backend/   ← backend npm root (feature/backend branch)
.worktrees/mobile/mobile/     ← mobile npm root  (feature/mobile branch)
```

Run all backend and mobile commands from their respective npm roots above, not from the repo root.

Docker Compose for Postgres + Redis lives at `.worktrees/backend/docker-compose.yml` (not in the npm root):
```bash
docker compose -f .worktrees/backend/docker-compose.yml up -d
```

## Backend — Non-obvious constraints

**Integration tests require Docker infra running** (`npm test` will fail if Postgres/Redis are not up).

**Tests use a separate `chat_test` database**, not `chat_dev`. Running tests against `chat_dev` by accident will drop and recreate all tables. The test database must exist before running tests.

**Conversation row ordering:** `user_a_id` always holds the lexicographically smaller UUID. This is enforced by a DB CHECK constraint, not application logic. Any code that creates conversations must sort the two UUIDs before inserting.

**`userSockets` Map in `socket/gateway.ts` is in-memory, single-node only.** It does not survive restarts or scale horizontally. Replace with a Redis adapter before adding a second server instance.

## Mobile — Non-obvious constraints

**Do not use `uuid` or `crypto.getRandomValues` anywhere in mobile.** Hermes does not implement `crypto.getRandomValues`. Temporary IDs in `useChat.ts` use `Date.now() + Math.random()` for this reason.

**`CURRENT_USER_ID = 'me'` in `ChatScreen.tsx` is a known bug**, not intentional. Sent messages always compare `sender_id === 'me'`, which never matches a real UUID, so all bubbles render left-aligned. Fixing it requires passing the real user ID from `AuthContext` into the screen.

## E2E Tests

`npm run e2e:test` auto-orchestrates everything: resets `chat_test` DB, spawns the backend, spawns Metro, seeds two users, then runs Detox. No manual setup needed beyond Docker infra being up and the app binary already built (`npm run e2e:build`).

**iOS Keychain persists across `device.reloadReactNative()`.** After a test logs in, the token survives into the next test. The `ensureLoginScreen()` helper in each test file handles this by navigating through the UI to sign out if the app opens on UserList instead of LoginScreen.

## Git

- `main` — repo root only (docs, openspec, CLAUDE.md)
- `feature/backend` — all backend code
- `feature/mobile` — all mobile + E2E code

Remote: `git@github.com:datslife/ai-practice-3.git`
