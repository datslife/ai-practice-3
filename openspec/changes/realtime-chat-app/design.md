## Context

Greenfield build — no existing codebase. This is a learning project for AI-driven development, targeting a production-quality 1-on-1 chat app on React Native (iOS + Android) with a Node.js + TypeScript backend. The approved design spec lives at `docs/superpowers/specs/2026-04-30-realtime-chat-design.md`.

## Goals / Non-Goals

**Goals:**
- Working auth (register/login with JWT)
- User list with real-time presence (online/offline)
- 1-on-1 direct messaging with real-time delivery and read receipts
- Optimistic UI with failure rollback
- Cross-platform iOS + Android support

**Non-Goals:**
- Push notifications
- Media/file attachments
- Message deletion or editing
- Group chats
- Typing indicators

## Decisions

### 1. REST + Socket.io + Redis (not pure WebSocket or GraphQL subscriptions)
Socket.io provides automatic reconnection, room management, and fallback transports out of the box. REST handles all stateless CRUD (auth, message history). Redis pub/sub allows horizontal scaling of Socket.io servers and acts as presence store.
**Alternatives considered:** Pure WebSocket (no built-in rooms/reconnect), GraphQL subscriptions (overkill for v1).

### 2. JWT over session-based auth
Stateless — no session table needed, works well with Socket.io handshake. Token passed on socket connection handshake for auth.
**Alternatives considered:** Session + cookie (requires session storage, more complex with sockets).

### 3. PostgreSQL for persistence
Relational model fits messages and conversations naturally. UUID PKs for global uniqueness. `read_at` timestamp on messages for read receipts (NULL = unread).
**Alternatives considered:** MongoDB (no relational integrity), SQLite (not production-grade for multi-user).

### 4. Redis presence with TTL + heartbeat
`presence:{userId}` key with short TTL (~30s), refreshed by client heartbeat every 15s. On socket disconnect, key expires naturally. Graceful degradation: if Redis is unavailable, hide presence indicators — chat still works.
**Alternatives considered:** DB-based presence (expensive polling), in-memory server map (breaks on multi-instance).

### 5. Monorepo structure (backend + mobile in same repo)
Keeps everything in one place for a learning project. `backend/` and `mobile/` directories at root.
**Alternatives considered:** Separate repos (unnecessary overhead for v1).

### 6. Docker Compose for local dev infrastructure
PostgreSQL + Redis via Docker Compose. No cloud dependency for development.

## Risks / Trade-offs

- **Socket.io reconnection storms** → Mitigated by exponential backoff config on client
- **JWT expiry on active socket** → Server emits auth error event; client redirects to Login
- **Redis unavailable** → Presence features degrade gracefully; chat still functional
- **Optimistic UI race conditions** → Each message gets a temp ID; server ack replaces temp with real ID; failure triggers rollback
- **React Native platform differences** → Test on both iOS and Android simulators throughout; no platform-specific shortcuts

## Migration Plan

Greenfield — no migration needed. Local dev setup:
1. `docker-compose up` (PostgreSQL + Redis)
2. Run DB migrations (`npm run migrate`)
3. Start backend (`npm run dev`)
4. Start React Native metro + run on simulator

Rollback: N/A (no production deployment in v1).

## Open Questions

- None — all decisions resolved in the approved design spec.
