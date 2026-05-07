# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This is a monorepo managed via git worktrees. The two sub-projects live in separate branches and are checked out as worktrees:

```
.worktrees/
  backend/          # git worktree → feature/backend branch
    backend/        # Node.js + TypeScript backend (npm root)
  mobile/           # git worktree → feature/mobile branch
    mobile/         # React Native app (npm root)
docs/superpowers/   # Design spec and implementation plans
openspec/changes/   # OpenSpec proposal, design, and task breakdown
```

All backend commands run from `.worktrees/backend/backend/`.
All mobile commands run from `.worktrees/mobile/mobile/`.

## Backend

**Stack:** Node.js, TypeScript, Express, Socket.io, PostgreSQL, Redis, JWT (jsonwebtoken), bcryptjs

**Dev dependencies:** Docker Compose for Postgres + Redis, ts-node-dev for hot reload

```bash
# Start infrastructure (Postgres on 5432, Redis on 6379)
docker compose -f .worktrees/backend/docker-compose.yml up -d

# Run dev server (port 3000, hot reload)
cd .worktrees/backend/backend && npm run dev

# Run DB migration
npm run migrate

# Run tests (integration, requires Docker infra running)
npm test

# Run a single test file
npx jest --runInBand tests/auth.test.ts

# Type check
npx tsc --noEmit
```

**Environment** (`.env` in `backend/`):
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/chat_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_secret_key_minimum_32_characters_long
PORT=3000
CORS_ORIGIN=http://localhost:8081
```

**API routes:**
- `POST /auth/register` — create user, returns `{ token, user }`
- `POST /auth/login` — returns `{ token, user }`
- `GET /auth/me` — validate token, returns `{ user }` (requires Bearer token)
- `GET /users` — all users except self with presence status (requires auth)
- `GET /conversations/:id/messages` — paginated message history (requires auth)
- `GET /health` — DB connectivity check

**Socket.io events (server → client):**
- `presence:update` — `{ userId, status: 'online'|'offline' }`
- `message:new` — `{ id, senderId, content, createdAt }`
- `message:sent` — `{ tempId, id, createdAt }` (sender confirmation)
- `message:error` — `{ tempId, error }`
- `message:read` — `{ messageId, readAt }` (sent to original sender)

**Socket.io events (client → server):**
- `heartbeat` — refreshes presence TTL in Redis
- `message:send` — `{ tempId, recipientId, content }`
- `message:read` — `{ messageId }`

**Architecture notes:**
- `src/app.ts` creates the Express app (exported for tests); `src/index.ts` is the entry point that wires HTTP + Socket.io
- Socket auth via JWT in `socket.handshake.auth.token`; userId stored in `socket.data.userId`
- `userSockets` Map (in-memory) maps userId → socketId for targeted delivery — not multi-node safe
- Conversation uniqueness enforced at DB level: `user_a_id < user_b_id` (smaller UUID goes in `user_a_id`)
- Presence stored in Redis via `presence:{userId}` key with 60s TTL; heartbeat refreshes it

**Tests** use a separate `chat_test` database. `tests/helpers/db.ts:resetDb()` drops and recreates tables before each suite.

## Mobile

**Stack:** React Native 0.76, TypeScript, React Navigation (stack), Socket.io-client, Axios, react-native-keychain

```bash
cd .worktrees/mobile/mobile

# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Unit tests (38 tests)
npm test

# Single test file
npx jest __tests__/hooks/useChat.test.tsx

# Lint (zero warnings enforced)
npm run lint

# Type check
npx tsc --noEmit

# E2E — build app first (once, ~5 min)
npm run e2e:build

# E2E — run all 6 tests (auto-starts backend + Metro)
npm run e2e:test
```

**API base URL:** `http://localhost:3000` (configured in `src/config/api.ts`)

**Architecture notes:**

`AuthContext` (`src/context/AuthContext.tsx`) is the single source of auth truth. On startup it reads the stored JWT, validates it via `GET /auth/me`, and either restores the session or clears an invalid token. `RootNavigator` switches between `AuthStack` and `MainStack` based on `isAuthenticated`.

Data flow per screen:
- **UserListScreen** — calls `useUsers` hook → `GET /users` + listens to `presence:update` socket events
- **ChatScreen** — calls `useChat(conversationId, currentUserId)` → `GET /conversations/:id/messages` + listens to `message:new/sent/error/read` socket events. Sends via `message:send` socket event with a `tempId` for optimistic UI. Message `status` field: `pending → sent | failed`.
- **ProfileScreen** — calls `useAuth().logout()` which disconnects socket and clears Keychain token

`socketClient.ts` maintains a module-level singleton socket + 15s heartbeat interval. `connect(token)` is called after login/register; `disconnect()` on logout.

`generateTempId()` in `useChat.ts` uses `Date.now() + Math.random()` (not `uuid`) because Hermes lacks `crypto.getRandomValues`.

**Known limitation:** `CURRENT_USER_ID = 'me'` is hardcoded in `ChatScreen` for bubble alignment. Sent messages show left-aligned in the current build.

## E2E Tests

E2E runs against a real backend on port 3000 using the `chat_test` database. `e2e/setup.ts` orchestrates: DB reset → kill ports → spawn backend → spawn Metro → wait for health → seed users (alice@e2e.test / Alice123!, bob@e2e.test / Bob12345!) → Detox setup.

Detox targets **iPhone 16 Pro, iOS 18.4**. Tests use `ensureLoginScreen()` helper to handle Keychain token persistence across `reloadReactNative()` calls — if the app lands on UserList, it signs out first.

`testID` props on interactive elements follow the pattern: `login-email-input`, `login-password-input`, `login-submit-button`, `login-error-text`, `userlist-search-input`, `userlist-row-{email}`, `nav-profile-button`, `chat-message-input`, `chat-send-button`, `profile-signout-button`.

## Git Branches

- `main` — project root (docs, openspec, worktree metadata)
- `feature/backend` — all backend code
- `feature/mobile` — all mobile code + E2E tests

Remote: `git@github.com:datslife/ai-practice-3.git`
