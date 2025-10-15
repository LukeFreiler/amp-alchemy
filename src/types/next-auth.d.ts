/**
 * NextAuth type extensions
 *
 * Extends the default NextAuth session and JWT to include
 * company and member information.
 */

import 'next-auth';
import { MemberRole } from '@/features/auth/types/session';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      company_id: string;
      role: MemberRole;
      name: string;
      email: string;
      auth_id: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    company_id: string;
    role: MemberRole;
    auth_id: string;
  }
}
