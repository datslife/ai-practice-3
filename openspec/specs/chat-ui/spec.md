## ADDED Requirements

### Requirement: App shows Login screen for unauthenticated users
The system SHALL display a Login screen as the entry point for unauthenticated users, with fields for email and password and a link to Register.

#### Scenario: Successful login navigates to User List
- **WHEN** the user enters valid credentials and taps Sign In
- **THEN** the app stores the JWT securely, navigates to the User List screen, and does not show Login again until logout

#### Scenario: Invalid credentials show inline error
- **WHEN** the user enters incorrect credentials
- **THEN** the app displays an inline error message without exposing raw server errors

### Requirement: App shows Register screen for new users
The system SHALL display a Register screen with fields for name, email, and password.

#### Scenario: Successful registration navigates to User List
- **WHEN** the user submits valid registration data
- **THEN** the app stores the JWT and navigates to User List

#### Scenario: Duplicate email shows error
- **WHEN** the submitted email is already taken
- **THEN** the app shows an inline error on the email field

### Requirement: User List screen shows all users with presence indicators
The system SHALL display a searchable list of users, each showing avatar (initials), display name, and an online/offline status dot.

#### Scenario: Presence dot updates in real-time
- **WHEN** a `presence:update` socket event is received
- **THEN** the corresponding user's status dot updates without a full list refresh

#### Scenario: Search filters by name
- **WHEN** the user types in the search bar
- **THEN** the list filters to show only users whose name contains the search string

#### Scenario: Tap user opens Chat screen
- **WHEN** the user taps on a user in the list
- **THEN** the app navigates to the Chat screen for that user

### Requirement: Chat screen shows message history and supports sending messages
The system SHALL display a scrollable message history with sent/received bubble layout, a text input, and a send button.

#### Scenario: Sent messages appear immediately (optimistic UI)
- **WHEN** the user taps Send
- **THEN** the message appears in the chat immediately in a pending state; on server confirmation it becomes confirmed; on failure it shows a retry button

#### Scenario: Incoming messages appear in real-time
- **WHEN** a `message:new` socket event is received
- **THEN** the message is appended to the chat without requiring a refresh

#### Scenario: Read receipt shown as ✓✓ Read
- **WHEN** a `message:read` event is received for a sent message
- **THEN** the message bubble shows "✓✓ Read" below it

#### Scenario: Socket disconnection shows reconnecting banner
- **WHEN** the socket connection is lost
- **THEN** a "Reconnecting..." banner is shown at the top of the Chat screen

### Requirement: Profile screen shows user info and sign-out
The system SHALL display the current user's avatar, display name, status, and a Sign Out button.

#### Scenario: Sign out clears session and navigates to Login
- **WHEN** the user taps Sign Out
- **THEN** the JWT is removed from secure storage, the socket disconnects, and the app navigates to Login
