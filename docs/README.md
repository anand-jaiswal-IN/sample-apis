# Authentication API Documentation

This document provides detailed information about the Authentication API, including endpoints, request/response formats, and authentication flows.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
  - [Signup](#signup)
  - [Signin](#signin)
  - [Google OAuth 2.0](#google-oauth-20)
  - [Refresh Token](#refresh-token)
  - [Logout](#logout)
- [User Management](#user-management)
  - [Get User Profile](#get-user-profile)
  - [Update User Profile](#update-user-profile)
  - [Update Avatar](#update-avatar)
  - [Delete Avatar](#delete-avatar)
- [Email Verification](#email-verification)
  - [Send Verification Email](#send-verification-email)
  - [Verify Email](#verify-email)
- [Password Management](#password-management)
  - [Forgot Password](#forgot-password)
  - [Reset Password](#reset-password)
  - [Change Password](#change-password)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Security](#security)

## Overview

The Authentication API provides secure user authentication and management capabilities. It includes:

- User registration and login
- Google OAuth 2.0 integration
- JWT-based authentication with refresh tokens
- Email verification
- Password management
- Avatar upload and management
- Rate limiting and security measures

## Authentication

### Signup

Create a new user account.

**Endpoint:** `POST /api/auth/signup`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (Success - 201 Created):**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "user-id-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "emailVerified": false,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "profile": {
      "id": "profile-id-123",
      "userId": "user-id-123",
      "bio": null,
      "avatarUrl": null,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - 400 Bad Request):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Invalid email format",
    "Password must be at least 8 characters long",
    "Passwords do not match"
  ]
}
```

**Response (Error - 409 Conflict):**

```json
{
  "success": false,
  "message": "Email already exists"
}
```

### Signin

Authenticate a user with email and password.

**Endpoint:** `POST /api/auth/signin`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "emailVerified": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "profile": {
      "id": "profile-id-123",
      "userId": "user-id-123",
      "bio": "Software developer",
      "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - 401 Unauthorized):**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Google OAuth 2.0

Authenticate with Google using OAuth 2.0.

**Step 1: Redirect to Google**
**Endpoint:** `GET /api/auth/google`

**Response (Redirect):**
Redirects to Google's authorization page.

**Step 2: Google Callback**
**Endpoint:** `GET /api/auth/google/callback`

**Query Parameters:**

- `code`: Authorization code from Google

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "user": {
      "id": "user-id-123",
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "emailVerified": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "profile": {
      "id": "profile-id-123",
      "userId": "user-id-123",
      "bio": null,
      "avatarUrl": "https://lh3.googleusercontent.com/.../photo.jpg",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - 400 Bad Request):**

```json
{
  "success": false,
  "message": "Authentication failed",
  "errors": ["Invalid authorization code"]
}
```

### Refresh Token

Generate a new access token using a refresh token.

**Endpoint:** `POST /api/auth/refresh-token`

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - 401 Unauthorized):**

```json
{
  "success": false,
  "message": "Invalid refresh token"
}
```

### Logout

Invalidate the user's refresh token.

**Endpoint:** `POST /api/auth/logout`

**Headers:**

- `Authorization`: Bearer <access_token>

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Response (Error - 401 Unauthorized):**

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

## User Management

### Get User Profile

Retrieve the current user's profile.

**Endpoint:** `GET /api/users/profile`

**Headers:**

- `Authorization`: Bearer <access_token>

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "user-id-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "emailVerified": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "profile": {
      "id": "profile-id-123",
      "userId": "user-id-123",
      "bio": "Software developer",
      "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Update User Profile

Update the current user's profile.

**Endpoint:** `PUT /api/users/profile`

**Headers:**

- `Authorization`: Bearer <access_token>

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "bio": "Full-stack developer"
}
```

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "User profile updated successfully",
  "data": {
    "user": {
      "id": "user-id-123",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "emailVerified": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "profile": {
      "id": "profile-id-123",
      "userId": "user-id-123",
      "bio": "Full-stack developer",
      "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Update Avatar

Upload a new avatar for the user.

**Endpoint:** `POST /api/users/avatar`

**Headers:**

- `Authorization`: Bearer <access_token>
- `Content-Type`: multipart/form-data

**Request Body:**

- `avatar`: Image file (max 5MB, JPEG/PNG/GIF/WebP)

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../avatar_thumb.jpg",
    "publicId": "user_user-id-123_avatar"
  }
}
```

**Response (Error - 400 Bad Request):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "File size must be less than 5MB",
    "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed"
  ]
}
```

### Delete Avatar

Delete the user's avatar.

**Endpoint:** `DELETE /api/users/avatar`

**Headers:**

- `Authorization`: Bearer <access_token>

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Avatar deleted successfully"
}
```

## Email Verification

### Send Verification Email

Send a verification email to the user.

**Endpoint:** `POST /api/auth/send-verification-email`

**Headers:**

- `Authorization`: Bearer <access_token>

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

**Response (Error - 429 Too Many Requests):**

```json
{
  "success": false,
  "message": "Too many requests",
  "errors": ["Please wait 1 hour before trying again."]
}
```

### Verify Email

Verify the user's email address using a token.

**Endpoint:** `POST /api/auth/verify-email`

**Request Body:**

```json
{
  "token": "verification-token-123"
}
```

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Response (Error - 400 Bad Request):**

```json
{
  "success": false,
  "message": "Invalid verification token"
}
```

**Response (Error - 410 Gone):**

```json
{
  "success": false,
  "message": "Verification token expired"
}
```

## Password Management

### Forgot Password

Request a password reset email.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

**Response (Error - 404 Not Found):**

```json
{
  "success": false,
  "message": "User not found"
}
```

### Reset Password

Reset the user's password using a token.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**

```json
{
  "token": "reset-token-123",
  "password": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Response (Error - 400 Bad Request):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Invalid reset token", "Password must be at least 8 characters long"]
}
```

### Change Password

Change the user's password.

**Endpoint:** `POST /api/auth/change-password`

**Headers:**

- `Authorization`: Bearer <access_token>

**Request Body:**

```json
{
  "currentPassword": "OldSecurePassword123!",
  "newPassword": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

**Response (Success - 200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response (Error - 401 Unauthorized):**

```json
{
  "success": false,
  "message": "Invalid current password"
}
```

## Error Handling

All API responses follow a consistent format:

```json
{
  "success": boolean,
  "message": string,
  "data": object | null,
  "errors": string[] | null,
  "meta": object | null
}
```

### Error Codes

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid credentials
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Password reset**: 3 requests per 15 minutes per email
- **Email verification**: 5 requests per hour per email
- **General API**: 100 requests per 15 minutes per IP

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## Security

The API implements several security measures:

- **Password Hashing**: Using bcrypt with 12 rounds
- **JWT Authentication**: Access tokens expire in 15 minutes, refresh tokens in 7 days
- **Email Verification**: Mandatory email verification with 24-hour expiration
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configured for specific origins
- **Helmet**: Security headers
- **Input Validation**: Zod schemas for all inputs
- **File Upload Validation**: Size and type restrictions for avatars

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# Cloudinary
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"

# Rate Limiting
AUTH_RATE_LIMIT_WINDOW="900000"
AUTH_RATE_LIMIT_MAX="5"
```

## Testing

Run tests with:

```bash
npm test
```

Test coverage includes:

- Authentication flows
- User management
- Email verification
- Password management
- Error handling
- Rate limiting
- File uploads

## Support

For support or questions, please contact:

- Email: support@yourdomain.com
- Documentation: https://docs.yourdomain.com
- GitHub Issues: https://github.com/yourusername/yourrepo/issues
