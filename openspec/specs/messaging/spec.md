## ADDED Requirements

### Requirement: User can send a message in a conversation
The system SHALL allow an authenticated user to send a text message in a 1-on-1 conversation. The message MUST be persisted to PostgreSQL before being delivered to the recipient.

#### Scenario: Successful message send
- **WHEN** a client emits `message:send { conversationId, content }` via Socket.io
- **THEN** the system persists the message to the `messages` table and emits `message:new { id, senderId, content, createdAt }` to the recipient's socket

#### Scenario: Empty content rejected
- **WHEN** a client emits `message:send` with empty or whitespace-only content
- **THEN** the system returns a socket error and does not persist the message

#### Scenario: Invalid conversationId rejected
- **WHEN** a client emits `message:send` with a conversationId that does not include the sender
- **THEN** the system returns a socket error and does not persist the message

### Requirement: User can view message history for a conversation
The system SHALL return paginated message history for a conversation via `GET /conversations/:id/messages`.

#### Scenario: Fetch message history
- **WHEN** an authenticated user requests messages for a conversation they belong to
- **THEN** the system returns a paginated list of messages ordered by `created_at` ascending

#### Scenario: Unauthorized access rejected
- **WHEN** a user requests messages for a conversation they are not a member of
- **THEN** the system returns HTTP 403

### Requirement: Read receipts are tracked per message
The system SHALL record when a message is read by the recipient using a `read_at` timestamp.

#### Scenario: Mark message as read
- **WHEN** a client emits `message:read { messageId }`
- **THEN** the system sets `read_at` on the message and emits `message:read { messageId, readAt }` to the sender's socket

#### Scenario: Already-read message ignored
- **WHEN** a client emits `message:read` for a message that already has `read_at` set
- **THEN** the system does nothing (idempotent)

### Requirement: Conversation is created automatically for a user pair
The system SHALL create a conversation record the first time two users exchange messages, or return the existing one if it already exists.

#### Scenario: First message between two users
- **WHEN** a message is sent between two users with no existing conversation
- **THEN** the system creates a `conversations` record and uses its ID for the message

#### Scenario: Existing conversation reused
- **WHEN** a message is sent between two users who already have a conversation
- **THEN** the system reuses the existing conversation record
