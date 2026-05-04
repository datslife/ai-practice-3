## Why

Build a production-quality 1-on-1 realtime chat app using React Native + Node.js as a learning environment for AI-driven development workflow. The goal is to ship a real, working app while practicing the full build cycle with AI assistance.

## What Changes

- New React Native mobile app (iOS + Android) with auth, user list, and chat screens
- New Node.js + TypeScript backend with REST API and Socket.io realtime layer
- PostgreSQL database for persistent storage of users, conversations, and messages
- Redis for user presence (online/offline) tracking via pub/sub
- JWT-based authentication (register + login)
- 1-on-1 direct messaging with optimistic UI and read receipts

## Capabilities

### New Capabilities

- `user-auth`: Email/password registration and login with JWT token issuance and validation
- `user-presence`: Online/offline status tracking via Redis with heartbeat and TTL
- `messaging`: 1-on-1 direct messaging with real-time delivery via Socket.io, read receipts, and message history
- `user-list`: Listing all users with their current presence status
- `chat-ui`: React Native screens — Login, Register, User List, Chat, Profile — dark minimal theme
- `socket-gateway`: Socket.io server with JWT handshake auth, message send/receive, presence update events

### Modified Capabilities

## Impact

- New React Native project (no existing mobile codebase)
- New Node.js backend project (no existing backend)
- Requires PostgreSQL and Redis instances (local dev via Docker)
- No existing APIs or dependencies affected — greenfield build
