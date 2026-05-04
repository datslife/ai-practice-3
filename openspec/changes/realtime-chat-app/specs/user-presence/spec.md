## ADDED Requirements

### Requirement: User presence is tracked via Redis with TTL
The system SHALL store each authenticated user's online status in Redis as `presence:{userId}` with a TTL of 30 seconds, refreshed every 15 seconds by a client heartbeat.

#### Scenario: User comes online
- **WHEN** a user establishes an authenticated Socket.io connection
- **THEN** the system sets `presence:{userId}` = `"online"` in Redis with 30s TTL and broadcasts `presence:update { userId, status: "online" }` to all connected clients

#### Scenario: User goes offline via disconnect
- **WHEN** a user's socket disconnects
- **THEN** the system deletes `presence:{userId}` from Redis and broadcasts `presence:update { userId, status: "offline" }` to all connected clients

#### Scenario: Heartbeat refreshes TTL
- **WHEN** a connected client emits a heartbeat event within the 15s interval
- **THEN** the system resets the TTL on `presence:{userId}` to 30 seconds

#### Scenario: TTL expiry marks user offline
- **WHEN** no heartbeat is received and the Redis TTL expires
- **THEN** the system considers the user offline; subsequent `GET /users` returns offline status for that user

### Requirement: Presence degrades gracefully when Redis is unavailable
The system SHALL continue to serve chat functionality when Redis is unavailable, hiding presence indicators rather than failing.

#### Scenario: Redis unavailable
- **WHEN** the Redis connection is down
- **THEN** the system omits presence data from `GET /users` responses and does not emit presence events; messaging continues to function normally
