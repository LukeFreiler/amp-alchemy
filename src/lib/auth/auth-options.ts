/**
 * NextAuth configuration options
 *
 * Handles OAuth authentication with Google and enriches the session
 * with company and member information.
 */

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { queryOne, transaction } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { Member } from '@/features/auth/types/session';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (!account || !user.email) {
          logger.warn('Sign-in attempt without account or email', { user });
          return false;
        }

        // Check if member exists by auth_id
        const existingMember = await queryOne<Member>(
          'SELECT * FROM members WHERE auth_id = $1',
          [account.providerAccountId]
        );

        if (existingMember) {
          logger.info('Existing member signed in', {
            member_id: existingMember.id,
            email: existingMember.email,
          });
          return true;
        }

        // Create new company and owner member for first-time users
        await transaction(async (client) => {
          // Create company with default name
          const companyResult = await client.query(
            'INSERT INTO companies (name) VALUES ($1) RETURNING id',
            [`${user.name}'s Company`]
          );
          const company = companyResult.rows[0] as { id: string };

          logger.info('Created new company', {
            company_id: company.id,
            company_name: `${user.name}'s Company`,
          });

          // Create owner member
          await client.query(
            `INSERT INTO members (company_id, auth_id, role, name, email)
             VALUES ($1, $2, $3, $4, $5)`,
            [company.id, account.providerAccountId, 'owner', user.name, user.email]
          );

          logger.info('Created owner member', {
            company_id: company.id,
            email: user.email,
            role: 'owner',
          });
        });

        return true;
      } catch (error) {
        logger.error('Sign-in callback error', { error, user });
        return false;
      }
    },

    async jwt({ token, account }) {
      try {
        // Enrich token with member data on initial sign-in
        if (account) {
          const member = await queryOne<Member>(
            'SELECT * FROM members WHERE auth_id = $1',
            [account.providerAccountId]
          );

          if (member) {
            token.id = member.id;
            token.company_id = member.company_id;
            token.role = member.role;
            token.auth_id = member.auth_id;
          }
        }

        return token;
      } catch (error) {
        logger.error('JWT callback error', { error, token });
        return token;
      }
    },

    async session({ session, token }) {
      try {
        // Attach member data to session
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.company_id = token.company_id as string;
          session.user.role = token.role as 'owner' | 'editor' | 'viewer';
          session.user.auth_id = token.auth_id as string;
        }

        return session;
      } catch (error) {
        logger.error('Session callback error', { error, token });
        return session;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
