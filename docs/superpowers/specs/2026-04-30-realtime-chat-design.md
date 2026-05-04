# Realtime Chat App — Design Spec

**Date:** 2026-04-30  
**Status:** Approved

---

## Overview

A production-quality 1-on-1 chat app built with React Native (iOS + Android) and a Node.js + TypeScript backend. Goal: learn AI-driven development workflow while shipping a real app.

---

## Architecture

**Option chosen:** REST + Socket.io + Redis

| Layer | Technology |
|---|---|
| Mobile client | React Native (cross-platform iOS + Android) |
| Backend | Node.js + TypeScript |
| Real-time | Socket.io |
| Auth | JWT (email/password) |
| Database | PostgreSQL |
| Presence + pub/sub | Redis |

### Real-time Event Flow

```
User A sends message
  → Server persists to PostgreSQL
  → Publishes via Redis pub/sub
  → Socket.io emits to User B's socket
  → User B receives message in real-time
```

---

## Features (v1)

- Email/password authentication (register + login)
- User list with online/offline presence indicators
- 1-on-1 direct messaging
- Real-time message delivery via Socket.io
- Message read receipts (read_at timestamp)
- Optimistic UI with rollback on send failure

---

## Screens & Navigation

```
Auth Stack (unauthenticated)
  ├── Login screen
  └── Register screen

Main Stack (authenticated)
  ├── User List screen
  ├── Chat screen
  └── Profile screen
```

**Theme:** Dark, minimal.

### Screen Details

**Login** — email + password fields, sign in button, link to register.

**User List** — search bar, list of users with avatar (initials), name, and online/offline status dot.

**Chat** — header with recipient name + online status, message bubbles (left = received, right = sent), read receipt (✓✓ Read), text input + send button.

**Profile** — avatar, display name, status, sign out button.

---

## Data Model

### PostgreSQL

```sql
users
  id          UUID PRIMARY KEY
  email       TEXT UNIQUE NOT NULL
  name        TEXT NOT NULL
  created_at  TIMESTAMPTZ

conversations
  id         UUID PRIMARY KEY
  user_a_id  UUID REFERENCES users
  user_b_id  UUID REFERENCES users
  created_at TIMESTAMPTZ

messages
  id              UUID PRIMARY KEY
  conversation_id UUID REFERENCES conversations
  sender_id       UUID REFERENCES users
  content         TEXT NOT NULL
  read_at         TIMESTAMPTZ  -- NULL = unread
  created_at      TIMESTAMPTZ
```

### Redis

| Key | Value | Purpose |
|---|---|---|
| `presence:{userId}` | `"online"` with TTL | Online status, refreshed by heartbeat |

---

## API

### REST Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/users` | List all users with presence status |
| GET | `/conversations/:id/messages` | Paginated message history |

All endpoints except auth require `Authorization: Bearer <token>`.

### Socket.io Events

| Direction | Event | Payload |
|---|---|---|
| client → server | `message:send` | `{ conversationId, content }` |
| server → client | `message:new` | `{ id, senderId, content, createdAt }` |
| client → server | `message:read` | `{ messageId }` |
| server → client | `message:read` | `{ messageId, readAt }` |
| server → client | `presence:update` | `{ userId, status: "online" \| "offline" }` |

All socket connections authenticated via JWT passed on handshake.

---

## Error Handling

| Layer | Scenario | Handling |
|---|---|---|
| Auth | Invalid credentials | 401 → inline error, no reason exposed |
| Auth | Expired JWT | Socket disconnects → client redirects to Login |
| Network | REST request fails | Retry once, then error toast |
| Socket | Disconnected | Auto-reconnect, "Reconnecting..." banner in UI |
| Socket | Message send fails | Optimistic UI rolls back, message marked "failed" + retry button |
| Messages | History load fails | Empty state + retry button |
| Presence | Redis down | Graceful degradation — hide presence, chat still works |

---

## Testing Strategy

| Layer | Type | Tool |
|---|---|---|
| Backend utils (JWT, formatting) | Unit | Jest |
| REST endpoints | Integration | Jest + real Postgres (test DB) |
| Socket.io events | Integration | Jest + socket.io-client |
| React Native hooks | Unit | React Native Testing Library |
| Screen renders | Component | React Native Testing Library |
| Critical flows (login, send message) | E2E | Detox |

---

## Out of Scope (v1)

- Push notifications
- Media/file attachments
- Message deletion/editing
- Group chats
- Typing indicators
