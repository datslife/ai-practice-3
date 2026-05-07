## ADDED Requirements

### Requirement: Socket.io connections are authenticated via JWT handshake
The system SHALL require a valid JWT to be passed in the socket handshake `auth` object. Unauthenticated connections MUST be rejected.

#### Scenario: Valid JWT accepted
- **WHEN** a client connects with a valid JWT in `socket.handshake.auth.token`
- **THEN** the connection is established and the user is associated with the socket

#### Scenario: Missing or invalid JWT rejected
- **WHEN** a client connects without a token or with an expired/invalid JWT
- **THEN** the server emits a connection error and closes the socket

#### Scenario: Expired JWT on active connection
- **WHEN** a JWT expires while the socket is connected
- **THEN** the server emits an `auth:expired` event and closes the socket; the client redirects to Login

### Requirement: Server broadcasts presence events on connect and disconnect
The system SHALL emit `presence:update` to all connected clients when any user connects or disconnects.

#### Scenario: User connects
- **WHEN** a socket connection is established
- **THEN** server broadcasts `presence:update { userId, status: "online" }` to all clients

#### Scenario: User disconnects
- **WHEN** a socket disconnects
- **THEN** server broadcasts `presence:update { userId, status: "offline" }` to all clients

### Requirement: Server delivers messages to recipient via socket
The system SHALL emit `message:new` to the recipient's socket after a message is persisted.

#### Scenario: Recipient is online
- **WHEN** a message is sent and the recipient has an active socket connection
- **THEN** the server emits `message:new { id, senderId, content, createdAt }` to the recipient's socket

#### Scenario: Recipient is offline
- **WHEN** a message is sent and the recipient has no active socket connection
- **THEN** the message is persisted; delivery occurs when the recipient next connects and loads message history

### Requirement: Server confirms message delivery to sender
The system SHALL emit a `message:sent` acknowledgment back to the sender's socket after the message is persisted.

#### Scenario: Message persisted successfully
- **WHEN** a message is saved to the database
- **THEN** server emits `message:sent { tempId, id, createdAt }` to the sender so the client can replace the optimistic message

#### Scenario: Message persistence fails
- **WHEN** the database write fails
- **THEN** server emits `message:error { tempId, error }` to the sender so the client can show a retry option
