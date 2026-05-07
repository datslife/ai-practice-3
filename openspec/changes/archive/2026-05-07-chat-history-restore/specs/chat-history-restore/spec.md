## ADDED Requirements

### Requirement: Backend exposes conversation lookup by recipient
The backend SHALL provide `GET /conversations/with/:recipientId` (authenticated). It MUST return `{ id, user_a_id, user_b_id, created_at }` for the conversation between the current user and the recipient, or `404` if no conversation exists.

#### Scenario: Conversation exists between two users
- **WHEN** authenticated user A calls `GET /conversations/with/:recipientId` where a conversation between A and recipient exists
- **THEN** server returns `200` with `{ id, user_a_id, user_b_id, created_at }`

#### Scenario: No conversation exists yet
- **WHEN** authenticated user calls `GET /conversations/with/:recipientId` and no conversation exists
- **THEN** server returns `404` with `{ error: 'Not found' }`

#### Scenario: Unauthenticated request
- **WHEN** unauthenticated caller hits `GET /conversations/with/:recipientId`
- **THEN** server returns `401`

### Requirement: Chat screen shows existing message history on open
The mobile app SHALL fetch and display previous messages when a user opens a conversation, regardless of whether a conversation ID was passed via navigation.

#### Scenario: User reopens a conversation with prior messages
- **WHEN** user navigates to ChatScreen for a recipient they have messaged before
- **THEN** all previous messages are displayed before any new input

#### Scenario: User opens a conversation for the first time
- **WHEN** user navigates to ChatScreen for a recipient with no prior conversation
- **THEN** message list is empty and no error is shown

### Requirement: useChat resolves conversation by recipient ID
The `useChat` hook SHALL accept `recipientId` (instead of `conversationId`) and internally call `GET /conversations/with/:recipientId` on mount to obtain the conversation ID, then fetch message history via `GET /conversations/:id/messages`.

#### Scenario: Conversation resolved successfully
- **WHEN** `useChat(recipientId, currentUserId)` mounts and a conversation exists
- **THEN** `loading` is `true` during fetch, then messages are populated and `loading` returns to `false`

#### Scenario: No conversation found (404 from resolution)
- **WHEN** `useChat(recipientId, currentUserId)` mounts and no conversation exists
- **THEN** messages remain `[]` and `loading` returns to `false` without error

### Requirement: useChat correctly unwraps messages API response
The `useChat` hook SHALL read `data.messages` (not `data`) from the `GET /conversations/:id/messages` response, which returns `{ messages: Message[] }`.

#### Scenario: Messages fetched successfully
- **WHEN** `GET /conversations/:id/messages` returns `{ messages: [m1, m2] }`
- **THEN** `messages` state equals `[m1, m2]`
