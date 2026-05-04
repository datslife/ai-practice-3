## ADDED Requirements

### Requirement: Authenticated user can list all other users with presence status
The system SHALL return a list of all users (excluding the requester) with their current online/offline presence status via `GET /users`.

#### Scenario: Fetch user list
- **WHEN** an authenticated user calls `GET /users`
- **THEN** the system returns an array of user objects each containing `id`, `name`, `email`, and `status` (`"online"` | `"offline"`)

#### Scenario: Requester excluded from list
- **WHEN** an authenticated user calls `GET /users`
- **THEN** the response does not include the calling user's own record

#### Scenario: Presence status reflects Redis state
- **WHEN** a user is online (has active `presence:{userId}` key in Redis)
- **THEN** their `status` field is `"online"`; otherwise it is `"offline"`

#### Scenario: Empty user list
- **WHEN** no other users exist in the system
- **THEN** the system returns an empty array with HTTP 200
