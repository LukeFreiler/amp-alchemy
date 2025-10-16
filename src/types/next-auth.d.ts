/**
 * NextAuth type extensions
 *
 * Extends NextAuth default types to include our custom user properties
 */

import 'next-auth';
import 'next-auth/jwt';
import { MemberRole } from '@/features/auth/types/session';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      company_id: string;
      role: MemberRole;
      name: string;
      email: string;
      auth_id: string | null;
    };
  }

  interface User {
    id: string;
    company_id?: string;
    role?: MemberRole;
    auth_id?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    company_id?: string;
    role?: MemberRole;
    auth_id?: string | null;
  }
}
