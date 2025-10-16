/**
 * NextAuth configuration options
 *
 * Handles both OAuth (Google) and Credentials (email/password) authentication.
 * Enriches the session with company and member information.
 */

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { queryOne, transaction } from '@/lib/db/query';
import { logger } from '@/lib/logger';
import { Member } from '@/features/auth/types/session';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, _req) {
        try {
          if (!credentials?.email || !credentials?.password) {
            logger.warn('Credentials sign-in attempt without email or password');
            return null;
          }

          // Find member by email
          const member = await queryOne<{
            id: string;
            company_id: string;
            role: string;
            name: string;
            email: string;
            password_hash: string | null;
            auth_id: string | null;
            auth_method: string;
          }>('SELECT * FROM members WHERE email = $1', [credentials.email]);

          if (!member) {
            logger.warn('Credentials sign-in attempt for non-existent email', {
              email: credentials.email,
            });
            return null;
          }

          // Check if user has password set (credentials or both)
          if (!member.password_hash) {
            logger.warn('Credentials sign-in attempt for OAuth-only account', {
              email: credentials.email,
            });
            return null;
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, member.password_hash);

          if (!isValidPassword) {
            logger.warn('Credentials sign-in attempt with invalid password', {
              email: credentials.email,
            });
            return null;
          }

          logger.info('Successful credentials sign-in', {
            member_id: member.id,
            email: member.email,
          });

          // Return user object that will be passed to jwt callback
          return {
            id: member.id,
            email: member.email,
            name: member.name,
            company_id: member.company_id,
            role: member.role as 'owner' | 'editor' | 'viewer',
            auth_id: member.auth_id,
          };
        } catch (error) {
          logger.error('Credentials authorization error', { error });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        // Credentials provider: user already authenticated in authorize()
        if (account?.provider === 'credentials') {
          return true;
        }

        // OAuth providers (Google)
        if (!account || !user.email) {
          logger.warn('OAuth sign-in attempt without account or email', { user });
          return false;
        }

        // Check if member exists by auth_id
        const existingMember = await queryOne<Member>('SELECT * FROM members WHERE auth_id = $1', [
          account.providerAccountId,
        ]);

        if (existingMember) {
          logger.info('Existing OAuth member signed in', {
            member_id: existingMember.id,
            email: existingMember.email,
          });
          return true;
        }

        // Create new company and owner member for first-time OAuth users
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

          // Create owner member with OAuth auth
          await client.query(
            `INSERT INTO members (company_id, auth_id, role, name, email, auth_method)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [company.id, account.providerAccountId, 'owner', user.name, user.email, 'oauth']
          );

          logger.info('Created owner member via OAuth', {
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

    async jwt({ token, account, user }) {
      try {
        // Enrich token with member data on initial sign-in
        if (account) {
          // Credentials provider: user object already has all needed data
          if (account.provider === 'credentials' && user) {
            const credentialsUser = user as {
              id: string;
              company_id: string;
              role: 'owner' | 'editor' | 'viewer';
              auth_id: string | null;
            };
            token.id = user.id;
            token.company_id = credentialsUser.company_id;
            token.role = credentialsUser.role;
            token.auth_id = credentialsUser.auth_id;
            return token;
          }

          // OAuth providers: query by auth_id
          const member = await queryOne<Member>('SELECT * FROM members WHERE auth_id = $1', [
            account.providerAccountId,
          ]);

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
