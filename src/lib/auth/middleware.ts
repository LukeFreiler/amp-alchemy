/**
 * Auth middleware for API route protection
 *
 * Provides helper functions to require authentication and authorization
 * in API routes. Throws typed errors that can be caught by handleError().
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { AuthenticationError, AuthorizationError } from '@/lib/errors';
import { AuthUser, MemberRole } from '@/features/auth/types/session';

/**
 * Require authentication for an API route
 *
 * @param allowedRoles - Optional array of roles that are allowed to access this route
 * @returns The authenticated user object
 * @throws AuthenticationError if not authenticated
 * @throws AuthorizationError if authenticated but role not allowed
 */
export async function requireAuth(allowedRoles?: MemberRole[]): Promise<AuthUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new AuthenticationError('Authentication required');
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
    throw new AuthorizationError(
      `Access denied. Requires one of: ${allowedRoles.join(', ')}`
    );
  }

  return session.user;
}

/**
 * Get the current authenticated user without throwing
 *
 * @returns The authenticated user object or null if not authenticated
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Check if current user has a specific role
 *
 * @param role - The role to check for
 * @returns true if user has the role, false otherwise
 */
export async function hasRole(role: MemberRole): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === role;
}

/**
 * Check if current user is owner or editor
 *
 * @returns true if user is owner or editor, false otherwise
 */
export async function canEdit(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === 'owner' || user?.role === 'editor';
}
