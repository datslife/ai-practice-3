## ADDED Requirements

### Requirement: User can register with email and password
The system SHALL allow a new user to create an account by providing a unique email address, a display name, and a password. The system SHALL return a signed JWT on success.

#### Scenario: Successful registration
- **WHEN** a user submits a valid email, name, and password to `POST /auth/register`
- **THEN** the system creates a user record, returns HTTP 201 with a signed JWT and user object

#### Scenario: Duplicate email rejected
- **WHEN** a user submits an email that already exists
- **THEN** the system returns HTTP 409 with an error indicating the email is taken

#### Scenario: Invalid input rejected
- **WHEN** a user submits a missing or malformed email, empty name, or empty password
- **THEN** the system returns HTTP 400 with a validation error; no user is created

### Requirement: User can log in with email and password
The system SHALL authenticate a user by verifying their email and password, returning a signed JWT on success.

#### Scenario: Successful login
- **WHEN** a user submits a correct email and password to `POST /auth/login`
- **THEN** the system returns HTTP 200 with a signed JWT and user object

#### Scenario: Wrong credentials rejected
- **WHEN** a user submits an incorrect email or password
- **THEN** the system returns HTTP 401 with a generic error; no token is issued

### Requirement: JWT must be presented for protected routes
The system SHALL require a valid `Authorization: Bearer <token>` header on all non-auth endpoints.

#### Scenario: Valid token accepted
- **WHEN** a request includes a valid, non-expired JWT
- **THEN** the system processes the request normally

#### Scenario: Missing or expired token rejected
- **WHEN** a request is missing the Authorization header or presents an expired JWT
- **THEN** the system returns HTTP 401 and rejects the request
