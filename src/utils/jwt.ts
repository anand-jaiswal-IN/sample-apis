import jwt from 'jsonwebtoken';
import { env } from './env.js';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  isOAuthUser: boolean;
  iat?: number;
  exp?: number;
}

// Generate access token
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });
}

// Generate refresh token
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
}

// Verify access token
export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

// Decode token without verification (for extracting payload)
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded?.exp) {
      return true;
    }
    return decoded.exp < Date.now() / 1000;
  } catch (error) {
    return true;
  }
}

// Generate both access and refresh tokens
export function generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

// Refresh access token using refresh token
export function refreshAccessToken(refreshToken: string): string {
  const payload = verifyRefreshToken(refreshToken);
  return generateAccessToken({
    userId: payload.userId,
    email: payload.email,
    isOAuthUser: payload.isOAuthUser,
  });
}

// Revoke refresh token (add to blacklist or mark as invalid)
// This is a placeholder - in a real implementation, you would store revoked tokens
export function revokeRefreshToken(refreshToken: string): void {
  // TODO: Implement token revocation logic
  // This could involve storing revoked tokens in a database or Redis
  console.log('Token revoked:', refreshToken);
}

// Check if refresh token is revoked
export function isRefreshTokenRevoked(refreshToken: string): boolean {
  // TODO: Implement token revocation check
  // This would check against a database or Redis of revoked tokens
  return false;
}
