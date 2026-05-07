## Why

When a user opens a chat conversation, navigates away, then returns, all previous messages are gone. The screen reloads empty on every mount because the app never fetches existing history and always starts with an empty message list.

## What Changes

- Add a backend endpoint `GET /conversations/with/:recipientId` to look up an existing conversation between the current user and a recipient.
- Fix `useChat` hook to resolve the conversation ID on mount (when null) by calling the new endpoint, then fetch message history.
- Fix `useChat` to correctly unwrap the API response (`data.messages` not `data`).
- Update `UserListScreen` to pass the `recipient.id` so `useChat` can resolve the conversation.

## Capabilities

### New Capabilities

- `chat-history-restore`: Fetch and display existing message history when opening a conversation.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. -->

## Impact

- **Backend**: `backend/src/conversations/router.ts` — new route added.
- **Mobile hooks**: `mobile/src/hooks/useChat.ts` — fetch on mount, fix response unwrapping.
- **Mobile screens**: `mobile/src/screens/UserListScreen.tsx` — pass `recipient.id` to nav params (already present via `User` type; `conversationId: null` stays as the initial value, resolved at runtime).
- **No breaking changes** — existing socket-based send flow is untouched.
