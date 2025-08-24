# API Reference

This document provides a detailed reference for all API endpoints.

## Base URL

```
https://api.yourdomain.com
```

## Authentication

All endpoints (except authentication endpoints) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "message": string,
  "data": object | null,
  "errors": string[] | null,
  "meta": object | null
}
```

## Endpoints

### Authentication

#### POST /api/auth/signup

Create a new user account.

**Request Body:**

```json
{
  "email": "string",
  "password": "string",
  "confirmPassword": "string",
  "firstName": "string",
  "lastName": "string"
}
```

**Response:**

- 201 Created: User created successfully
- 400 Bad Request: Validation failed
- 409 Conflict: Email already exists

#### POST /api/auth/signin

Authenticate a user with email and password.

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**

- 200 OK: Login successful
- 401 Unauthorized: Invalid credentials

#### GET /api/auth/google

Redirect to Google's OAuth 2.0 authorization page.

**Query Parameters:**

- `redirect_uri`: Optional callback URL

**Response:**

- 302 Redirect: To Google's authorization page

#### GET /api/auth/google/callback

Handle Google OAuth 2.0 callback.

**Query Parameters:**

- `code`: Authorization code from Google
- `error`: Error message (if any)

**Response:**

- 200 OK: Authentication successful
- 400 Bad Request: Authentication failed

#### POST /api/auth/refresh-token

Generate a new access token using a refresh token.

**Request Body:**

```json
{
  "refreshToken": "string"
}
```

**Response:**

- 200 OK: Token refreshed successfully
- 401 Unauthorized: Invalid refresh token

#### POST /api/auth/logout

Invalidate the user's refresh token.

**Headers:**

- `Authorization`: Bearer <access_token>

**Response:**

- 200 OK: Logout successful
- 401 Unauthorized: Unauthorized

### User Management

#### GET /api/users/profile

Retrieve the current user's profile.

**Headers:**

- `Authorization`: Bearer <access_token>

**Response:**

- 200 OK: User profile retrieved successfully
- 401 Unauthorized: Unauthorized

#### PUT /api/users/profile

Update the current user's profile.

**Headers:**

- `Authorization`: Bearer <access_token>

**Request Body:**

```json
{
  "firstName": "string",
  "lastName": "string",
  "bio": "string"
}
```

**Response:**

- 200 OK: User profile updated successfully
- 400 Bad Request: Validation failed
- 401 Unauthorized: Unauthorized

#### POST /api/users/avatar

Upload a new avatar for the user.

**Headers:**

- `Authorization`: Bearer <access_token>
- `Content-Type`: multipart/form-data

**Request Body:**

- `avatar`: Image file (max 5MB, JPEG/PNG/GIF/WebP)

**Response:**

- 200 OK: Avatar uploaded successfully
- 400 Bad Request: Validation failed
- 401 Unauthorized: Unauthorized

#### DELETE /api/users/avatar

Delete the user's avatar.

**Headers:**

- `Authorization`: Bearer <access_token>

**Response:**

- 200 OK: Avatar deleted successfully
- 401 Unauthorized: Unauthorized

### Email Verification

#### POST /api/auth/send-verification-email

Send a verification email to the user.

**Headers:**

- `Authorization`: Bearer <access_token>

**Response:**

- 200 OK: Verification email sent successfully
- 429 Too Many Requests: Rate limit exceeded
- 401 Unauthorized: Unauthorized

#### POST /api/auth/verify-email

Verify the user's email address using a token.

**Request Body:**

```json
{
  "token": "string"
}
```

**Response:**

- 200 OK: Email verified successfully
- 400 Bad Request: Invalid verification token
- 410 Gone: Verification token expired

### Password Management

#### POST /api/auth/forgot-password

Request a password reset email.

**Request Body:**

```json
{
  "email": "string"
}
```

**Response:**

- 200 OK: Password reset email sent successfully
- 404 Not Found: User not found
- 429 Too Many Requests: Rate limit exceeded

#### POST /api/auth/reset-password

Reset the user's password using a token.

**Request Body:**

```json
{
  "token": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

**Response:**

- 200 OK: Password reset successfully
- 400 Bad Request: Validation failed
- 410 Gone: Reset token expired

#### POST /api/auth/change-password

Change the user's password.

**Headers:**

- `Authorization`: Bearer <access_token>

**Request Body:**

```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Response:**

- 200 OK: Password changed successfully
- 400 Bad Request: Validation failed
- 401 Unauthorized: Invalid current password

## Error Codes

| Code | Meaning                                                       |
| ---- | ------------------------------------------------------------- |
| 400  | Bad Request - Invalid request data                            |
| 401  | Unauthorized - Authentication required or invalid credentials |
| 403  | Forbidden - Insufficient permissions                          |
| 404  | Not Found - Resource not found                                |
| 409  | Conflict - Resource already exists                            |
| 410  | Gone - Resource no longer available                           |
| 429  | Too Many Requests - Rate limit exceeded                       |
| 500  | Internal Server Error - Server error                          |

## Rate Limiting

Rate limits are applied to all endpoints:

| Endpoint           | Window     | Max Requests |
| ------------------ | ---------- | ------------ |
| Authentication     | 15 minutes | 5            |
| Password Reset     | 15 minutes | 3            |
| Email Verification | 1 hour     | 5            |
| General API        | 15 minutes | 100          |

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  password?: string; // Not returned in responses
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

### Profile

```typescript
interface Profile {
  id: string;
  userId: string;
  bio?: string;
  avatarUrl?: string;
  publicId?: string; // Cloudinary public ID
  createdAt: Date;
  updatedAt: Date;
}
```

### Email Verification

```typescript
interface EmailVerification {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
```

### Password Reset

```typescript
interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}
```

## Webhooks

### Email Verified

Triggered when a user verifies their email address.

**Payload:**

```json
{
  "event": "email.verified",
  "userId": "user-id-123",
  "email": "user@example.com",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### Password Changed

Triggered when a user changes their password.

**Payload:**

```json
{
  "event": "password.changed",
  "userId": "user-id-123",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## SDKs

### JavaScript/TypeScript

```typescript
import { AuthClient } from '@yourdomain/auth-sdk';

const auth = new AuthClient({
  baseURL: 'https://api.yourdomain.com',
  clientId: 'your-client-id',
});

// Signup
const user = await auth.signup({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  firstName: 'John',
  lastName: 'Doe',
});

// Signin
const tokens = await auth.signin({
  email: 'user@example.com',
  password: 'SecurePassword123!',
});

// Get profile
const profile = await auth.getProfile();

// Update profile
await auth.updateProfile({
  firstName: 'Jane',
  lastName: 'Smith',
});
```

### Python

```python
from auth_sdk import AuthClient

auth = AuthClient(
    base_url='https://api.yourdomain.com',
    client_id='your-client-id'
)

# Signup
user = auth.signup(
    email='user@example.com',
    password='SecurePassword123!',
    first_name='John',
    last_name='Doe'
)

# Signin
tokens = auth.signin(
    email='user@example.com',
    password='SecurePassword123!'
)

# Get profile
profile = auth.get_profile()

# Update profile
auth.update_profile(
    first_name='Jane',
    last_name='Smith'
)
```

## Testing

### cURL Examples

#### Signup

```bash
curl -X POST https://api.yourdomain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "confirmPassword": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### Signin

```bash
curl -X POST https://api.yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

#### Get Profile

```bash
curl -X GET https://api.yourdomain.com/api/users/profile \
  -H "Authorization: Bearer <access_token>"
```

#### Upload Avatar

```bash
curl -X POST https://api.yourdomain.com/api/users/avatar \
  -H "Authorization: Bearer <access_token>" \
  -F "avatar=@/path/to/image.jpg"
```

### Postman Collection

[Download Postman Collection](https://api.yourdomain.com/docs/postman/auth-api-collection.json)

## Changelog

### v1.0.0 (2023-01-01)

- Initial release
- Basic authentication (email/password)
- Google OAuth 2.0
- User profile management
- Email verification
- Password management
- Avatar upload
