## 1. Project Scaffold & Infrastructure

- [x] 1.1 Initialize monorepo structure with `backend/` and `mobile/` directories
- [x] 1.2 Create `docker-compose.yml` with PostgreSQL and Redis services
- [x] 1.3 Initialize Node.js + TypeScript project in `backend/` with ESLint, Jest config
- [x] 1.4 Initialize React Native project in `mobile/` with TypeScript template
- [x] 1.5 Write and run initial DB migration: create `users`, `conversations`, `messages` tables

## 2. Backend — User Auth

- [x] 2.1 Implement `POST /auth/register` — validate input, hash password, create user, return JWT
- [x] 2.2 Implement `POST /auth/login` — verify credentials, return JWT
- [x] 2.3 Implement JWT middleware for protected routes
- [x] 2.4 Write integration tests for register, login, and JWT middleware

## 3. Backend — User List & Presence

- [x] 3.1 Implement `GET /users` — return all users except requester with presence status from Redis
- [x] 3.2 Implement Redis presence service: set/delete `presence:{userId}` with TTL
- [x] 3.3 Write integration tests for user list and presence service

## 4. Backend — Messaging

- [x] 4.1 Implement conversation lookup/create logic (get-or-create for user pair)
- [x] 4.2 Implement `GET /conversations/:id/messages` — paginated message history with auth guard
- [x] 4.3 Write unit tests for conversation and message DB logic

## 5. Backend — Socket.io Gateway

- [x] 5.1 Set up Socket.io server with JWT handshake authentication
- [x] 5.2 Handle `connect` / `disconnect`: update Redis presence, broadcast `presence:update`
- [x] 5.3 Handle `message:send`: persist message, emit `message:new` to recipient, emit `message:sent` to sender
- [x] 5.4 Handle `message:read`: set `read_at`, emit `message:read` to sender
- [x] 5.5 Handle heartbeat event: refresh Redis TTL
- [x] 5.6 Write integration tests for all socket events using `socket.io-client`

## 6. Mobile — Navigation & Auth Stack

- [x] 6.1 Install and configure React Navigation (stack navigator)
- [x] 6.2 Set up Auth Stack (Login, Register) and Main Stack (User List, Chat, Profile)
- [x] 6.3 Implement JWT secure storage service (read/write/clear token)
- [x] 6.4 Implement auth state detection on app launch (redirect based on token presence)

## 7. Mobile — Login & Register Screens

- [x] 7.1 Build Login screen — email + password fields, Sign In button, navigate to Register link
- [x] 7.2 Build Register screen — name, email, password fields, Register button
- [x] 7.3 Wire Login/Register screens to backend API calls with inline error handling
- [x] 7.4 Write component tests for Login and Register screens

## 8. Mobile — User List Screen

- [x] 8.1 Build User List screen — search bar, FlatList with avatar (initials), name, presence dot
- [x] 8.2 Fetch users on mount via `GET /users`; show loading and error states
- [x] 8.3 Wire real-time presence dot updates via `presence:update` socket events
- [x] 8.4 Implement search filter (client-side, by name)
- [x] 8.5 Write component tests for User List screen

## 9. Mobile — Chat Screen

- [x] 9.1 Build Chat screen — header with recipient name + status, message bubble list, text input + send button
- [x] 9.2 Fetch message history on mount via `GET /conversations/:id/messages`
- [x] 9.3 Implement optimistic message send: show pending state, replace on `message:sent`, rollback on `message:error`
- [x] 9.4 Handle incoming `message:new` events — append to list in real-time
- [x] 9.5 Emit `message:read` on message view; handle `message:read` event to show ✓✓ Read
- [x] 9.6 Show "Reconnecting..." banner on socket disconnect; hide on reconnect
- [x] 9.7 Write component tests for Chat screen (send flow, optimistic UI, read receipts)

## 10. Mobile — Profile Screen & Socket Lifecycle

- [x] 10.1 Build Profile screen — avatar, display name, Sign Out button
- [x] 10.2 Implement sign-out: clear JWT from secure storage, disconnect socket, navigate to Login
- [x] 10.3 Implement Socket.io client service: connect on login, send heartbeat every 15s, auto-reconnect
- [x] 10.4 Write unit tests for socket service and auth storage service

## 11. End-to-End Verification

- [x] 11.1 Run full lint + typecheck on backend and mobile
- [x] 11.2 Run all unit and integration tests (backend + mobile)
- [x] 11.3 Manual smoke test: register two users, send messages, verify real-time delivery and read receipts
- [x] 11.4 Test on both iOS and Android simulators
