## 1. Project Scaffold & Infrastructure

- [ ] 1.1 Initialize monorepo structure with `backend/` and `mobile/` directories
- [ ] 1.2 Create `docker-compose.yml` with PostgreSQL and Redis services
- [ ] 1.3 Initialize Node.js + TypeScript project in `backend/` with ESLint, Jest config
- [ ] 1.4 Initialize React Native project in `mobile/` with TypeScript template
- [ ] 1.5 Write and run initial DB migration: create `users`, `conversations`, `messages` tables

## 2. Backend — User Auth

- [ ] 2.1 Implement `POST /auth/register` — validate input, hash password, create user, return JWT
- [ ] 2.2 Implement `POST /auth/login` — verify credentials, return JWT
- [ ] 2.3 Implement JWT middleware for protected routes
- [ ] 2.4 Write integration tests for register, login, and JWT middleware

## 3. Backend — User List & Presence

- [ ] 3.1 Implement `GET /users` — return all users except requester with presence status from Redis
- [ ] 3.2 Implement Redis presence service: set/delete `presence:{userId}` with TTL
- [ ] 3.3 Write integration tests for user list and presence service

## 4. Backend — Messaging

- [ ] 4.1 Implement conversation lookup/create logic (get-or-create for user pair)
- [ ] 4.2 Implement `GET /conversations/:id/messages` — paginated message history with auth guard
- [ ] 4.3 Write unit tests for conversation and message DB logic

## 5. Backend — Socket.io Gateway

- [ ] 5.1 Set up Socket.io server with JWT handshake authentication
- [ ] 5.2 Handle `connect` / `disconnect`: update Redis presence, broadcast `presence:update`
- [ ] 5.3 Handle `message:send`: persist message, emit `message:new` to recipient, emit `message:sent` to sender
- [ ] 5.4 Handle `message:read`: set `read_at`, emit `message:read` to sender
- [ ] 5.5 Handle heartbeat event: refresh Redis TTL
- [ ] 5.6 Write integration tests for all socket events using `socket.io-client`

## 6. Mobile — Navigation & Auth Stack

- [ ] 6.1 Install and configure React Navigation (stack navigator)
- [ ] 6.2 Set up Auth Stack (Login, Register) and Main Stack (User List, Chat, Profile)
- [ ] 6.3 Implement JWT secure storage service (read/write/clear token)
- [ ] 6.4 Implement auth state detection on app launch (redirect based on token presence)

## 7. Mobile — Login & Register Screens

- [ ] 7.1 Build Login screen — email + password fields, Sign In button, navigate to Register link
- [ ] 7.2 Build Register screen — name, email, password fields, Register button
- [ ] 7.3 Wire Login/Register screens to backend API calls with inline error handling
- [ ] 7.4 Write component tests for Login and Register screens

## 8. Mobile — User List Screen

- [ ] 8.1 Build User List screen — search bar, FlatList with avatar (initials), name, presence dot
- [ ] 8.2 Fetch users on mount via `GET /users`; show loading and error states
- [ ] 8.3 Wire real-time presence dot updates via `presence:update` socket events
- [ ] 8.4 Implement search filter (client-side, by name)
- [ ] 8.5 Write component tests for User List screen

## 9. Mobile — Chat Screen

- [ ] 9.1 Build Chat screen — header with recipient name + status, message bubble list, text input + send button
- [ ] 9.2 Fetch message history on mount via `GET /conversations/:id/messages`
- [ ] 9.3 Implement optimistic message send: show pending state, replace on `message:sent`, rollback on `message:error`
- [ ] 9.4 Handle incoming `message:new` events — append to list in real-time
- [ ] 9.5 Emit `message:read` on message view; handle `message:read` event to show ✓✓ Read
- [ ] 9.6 Show "Reconnecting..." banner on socket disconnect; hide on reconnect
- [ ] 9.7 Write component tests for Chat screen (send flow, optimistic UI, read receipts)

## 10. Mobile — Profile Screen & Socket Lifecycle

- [ ] 10.1 Build Profile screen — avatar, display name, Sign Out button
- [ ] 10.2 Implement sign-out: clear JWT from secure storage, disconnect socket, navigate to Login
- [ ] 10.3 Implement Socket.io client service: connect on login, send heartbeat every 15s, auto-reconnect
- [ ] 10.4 Write unit tests for socket service and auth storage service

## 11. End-to-End Verification

- [ ] 11.1 Run full lint + typecheck on backend and mobile
- [ ] 11.2 Run all unit and integration tests (backend + mobile)
- [ ] 11.3 Manual smoke test: register two users, send messages, verify real-time delivery and read receipts
- [ ] 11.4 Test on both iOS and Android simulators
