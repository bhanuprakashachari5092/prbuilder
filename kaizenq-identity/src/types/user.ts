/**
 * User Core Types for KaizenQ Identity
 */

export type UserRole = 'student' | 'alumni' | 'recruiter' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface UserSession {
  user: User
  token: string
  expiresAt: string
}

export * from './profile.ts'
