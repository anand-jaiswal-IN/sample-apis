# Express.js User Authentication System - Implementation Plan

## Overview

This document outlines the detailed implementation plan for creating a robust Express.js user authentication system with all requested features including Google OAuth 2.0, email verification, avatar uploads, and comprehensive security measures.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Express API   │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │             │ │    │ │             │ │    │ │             │ │
│ │  Frontend   │ │    │ │   Routes    │ │    │ │   Users     │ │
│ │  (React/Vue)│ │    │ │             │ │    │ │   Profiles  │ │
│ │             │ │    │ └─────────────┘ │    │ │             │ │
│ └─────────────┘ │    │ ┌─────────────┐ │    │ └─────────────┘ │
│                 │    │ │   Services  │ │    │                 │
│ ┌─────────────┐ │    │ │             │ │    │ ┌─────────────┐ │
│ │             │ │    │ │ Auth        │ │    │ │   Sessions  │ │
│ │  Mobile App │ │    │ │ Email       │ │    │ │             │ │
│ │             │ │    │ │ Upload      │ │    │ └─────────────┘ │
│ └─────────────┘ │    │ │ OAuth       │ │    │                 │
│                 │    │ │             │ │    └─────────────────┘
└─────────────────┘    │ └─────────────┘ │
                       │ ┌─────────────┐ │
                       │ │   Utils     │ │
                       │ │             │ │
                       │ │ Validation  │ │
                       │ │ Helpers     │ │
                       │ │             │ │
                       │ └─────────────┘ │
                       └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   External APIs │
                       │                 │
                       │ ┌─────────────┐ │
                       │ │   Resend    │ │
                       │ │  (Email)    │ │
                       │ └─────────────┘ │
                       │                 │
                       │ ┌─────────────┐ │
                       │ │  Google     │ │
                       │ │  OAuth 2.0  │ │
                       │ └─────────────┘ │
                       │                 │
                       │ ┌─────────────┐ │
                       │ │  Cloudinary │ │
                       │ │ (Avatar)    │ │
                       │ └─────────────┘ │
                       └─────────────────┘
```

## Database Schema Design

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

### Profiles Table

```sql
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  avatar_url VARCHAR(500),
  bio TEXT,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  location VARCHAR(200),
  website VARCHAR(200),
  social_links JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
```

### Sessions Table

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  access_token_hash VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

## File Structure

```
src/
├── config/
│   ├── database.ts
│   ├── auth.ts
│   ├── email.ts
│   └── cloudinary.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   └── profile.controller.ts
├── middleware/
│   ├── auth.ts
│   ├── rateLimiter.ts
│   ├── validation.ts
│   └── errorHandler.ts
├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   └── profile.routes.ts
├── services/
│   ├── auth.service.ts
│   ├── email.service.ts
│   ├── upload.service.ts
│   └── google.service.ts
├── types/
│   ├── auth.types.ts
│   ├── user.types.ts
│   └── api.types.ts
├── utils/
│   ├── validation.ts
│   ├── helpers.ts
│   └── constants.ts
├── database/
│   ├── migrations/
│   └── schema.ts
└── app.ts
```

## Implementation Steps

### Phase 1: Core Setup

1. **Install Dependencies**
   - `drizzle-orm` - Database ORM
   - `bcrypt` - Password hashing
   - `jsonwebtoken` - JWT token generation
   - `zod` - Schema validation
   - `resend` - Email service
   - `cloudinary` - Image uploads
   - `express-rate-limit` - Rate limiting
   - `google-auth-library` - Google OAuth 2.0

2. **Database Configuration**
   - Set up PostgreSQL connection
   - Configure Drizzle ORM
   - Create database migrations
   - Set up environment variables

### Phase 2: Authentication System

1. **User Model & Schema**
   - Create User and Profile models
   - Implement soft deletes
   - Set up validation schemas

2. **Authentication Routes**
   - POST /api/auth/signup - User registration
   - POST /api/auth/signin - User login
   - POST /api/auth/refresh - Refresh token
   - POST /api/auth/logout - User logout
   - GET /api/auth/google - Google OAuth initiation
   - GET /api/auth/google/callback - Google OAuth callback

3. **JWT Implementation**
   - Access token (15 minutes expiry)
   - Refresh token (7 days expiry)
   - Token validation middleware
   - Session management

### Phase 3: Email & Upload Services

1. **Email Service**
   - Resend configuration
   - Email verification templates
   - Password reset functionality
   - Welcome emails

2. **Upload Service**
   - Cloudinary configuration
   - Avatar upload with optimization
   - Image resizing and compression
   - File validation

### Phase 4: Security & Rate Limiting

1. **Rate Limiting**
   - Auth-specific rate limiting (5 attempts per 15 minutes)
   - General API rate limiting
   - IP-based tracking

2. **Security Middleware**
   - CORS configuration
   - Helmet security headers
   - Input validation
   - SQL injection protection

### Phase 5: Testing & Documentation

1. **Comprehensive Testing**
   - Unit tests for all services
   - Integration tests for API endpoints
   - Authentication flow testing
   - Error handling testing

2. **Documentation**
   - API documentation with OpenAPI/Swagger
   - Setup instructions
   - Environment configuration guide
   - Deployment guide

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
AUTH_RATE_LIMIT_WINDOW=900000

# Server
PORT=3000
NODE_ENV=development
```

## Security Considerations

1. **Password Security**
   - bcrypt with salt rounds 12
   - Minimum password length 8 characters
   - Password complexity requirements

2. **Token Security**
   - JWT secrets with minimum 32 characters
   - Secure token storage (HttpOnly cookies)
   - Token revocation on logout

3. **Rate Limiting**
   - Separate limits for auth endpoints
   - IP-based tracking
   - Progressive delays for failed attempts

4. **Data Protection**
   - Input validation and sanitization
   - SQL injection prevention
   - XSS protection
   - CSRF protection

## Performance Optimization

1. **Database**
   - Proper indexing
   - Connection pooling
   - Query optimization

2. **Caching**
   - Redis for session storage
   - Cache frequently accessed data
   - CDN for static assets

3. **API Optimization**
   - Response compression
   - Request limiting
   - Efficient error handling

## Monitoring & Logging

1. **Logging**
   - Request/response logging
   - Error tracking
   - Security event logging

2. **Monitoring**
   - Health checks
   - Performance metrics
   - Error rate monitoring

This implementation plan provides a comprehensive roadmap for building a secure, scalable, and feature-rich user authentication system with all the requested capabilities.
