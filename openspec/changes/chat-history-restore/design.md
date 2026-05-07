## Context

The chat screen mounts with `conversationId: null` (always passed that way from UserList). The `useChat` hook guards its fetch with `if (!conversationId) return`, so no history is ever loaded. Even if a conversation ID were available, the hook misreads the API response: `GET /:id/messages` returns `{ messages: [...] }` but the hook writes `setMessages(data)` instead of `setMessages(data.messages)`.

There is no endpoint to look up a conversation by participant pair, so the app cannot resolve an existing conversation on mount.

## Goals / Non-Goals

**Goals:**
- Display existing message history when opening a conversation with a user you have chatted with before.
- Resolve the conversation ID from the recipient ID on mount so history can be fetched.
- Fix the response-unwrapping bug (`data` → `data.messages`).

**Non-Goals:**
- Pagination / infinite scroll of history.
- Creating a conversation proactively before the first message is sent (conversation creation already happens server-side on first `message:send` socket event).
- Offline caching of history.

## Decisions

**Decision 1 — New endpoint `GET /conversations/with/:recipientId`**
Returns the existing conversation for the authenticated user + recipientId pair, or 404 if none. Returns `{ id, user_a_id, user_b_id, created_at }`.

Alternatives considered:
- Passing the real `conversationId` from UserList: the existing `/users` list endpoint does not return conversation IDs, so this would require a backend change too. The new lookup endpoint is simpler and keeps UserList unchanged.
- Fetching all conversations on mount: over-fetches data, adds complexity.

**Decision 2 — Resolution logic lives in `useChat`, not ChatScreen**
`useChat(recipientId, currentUserId)` resolves the conversationId internally. ChatScreen does not need to know about conversation IDs at all.

Alternatives considered:
- Resolving in ChatScreen and passing ID down: leaks data-layer concerns into a screen component.

**Decision 3 — `conversationId` becomes internal state in `useChat`**
The hook signature changes from `useChat(conversationId, currentUserId)` to `useChat(recipientId, currentUserId)`. The hook fetches the conversation by recipient, stores the resolved ID in state, then fetches messages.

## Risks / Trade-offs

- **Race condition** — user sends a message before resolution completes → `sendMessage` already uses `socket.emit` which does not need a conversation ID; the server resolves/creates the conversation. Risk: low.
- **First-time chat** — no conversation exists yet → `/with/:recipientId` returns 404 → `useChat` starts with empty messages (correct behavior). Risk: none.
- **Breaking hook signature** — any other caller of `useChat(conversationId, ...)` will break. Current audit: only `ChatScreen.tsx` calls `useChat`. Risk: low.
