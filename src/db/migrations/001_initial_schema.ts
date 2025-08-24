import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(createId()),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  isOAuthUser: boolean('is_oauth_user').default(false).notNull(),
  googleId: text('google_id').unique(),
  refreshTokens: text('refresh_tokens').array(),
});

// Profiles table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().default(createId()),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  phone: text('phone'),
  dateOfBirth: timestamp('date_of_birth', { mode: 'date' }),
  gender: text('gender'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  postalCode: text('postal_code'),
  isPublic: boolean('is_public').default(true).notNull(),
});

// Indexes for better query performance
export const usersEmailIndex = index('users_email_idx').on(users.email);
export const usersGoogleIdIndex = index('users_google_id_idx').on(users.googleId);
export const profilesUserIdIndex = index('profiles_user_id_idx').on(profiles.userId);

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
