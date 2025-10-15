/**
 * Error handling utilities
 *
 * Standard error classes and response formatting for consistent error handling across the API.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Error response type (matches API response envelope)
 */
export type ErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

/**
 * Base API error class
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends ApiError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(code, message, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required', code: string = 'UNAUTHORIZED') {
    super(code, message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions', code: string = 'FORBIDDEN') {
    super(code, message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', code: string = 'NOT_FOUND') {
    super(code, `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends ApiError {
  constructor(message: string, code: string = 'CONFLICT') {
    super(code, message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Convert any error to a formatted error response
 *
 * @example
 * ```ts
 * try {
 *   // ... some code
 * } catch (error) {
 *   return handleError(error);
 * }
 * ```
 */
export function handleError(error: unknown): NextResponse<ErrorResponse> {
  // Known API errors
  if (error instanceof ApiError) {
    logger.error(`API error: ${error.code}`, {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    });

    return NextResponse.json<ErrorResponse>(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  // Unknown errors
  logger.error('Unexpected error', {
    error: error instanceof Error ? error.message : String(error),
  });

  return NextResponse.json<ErrorResponse>(
    {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}

/**
 * Create an error response manually
 *
 * @example
 * ```ts
 * if (!user) {
 *   return errorResponse('USER_NOT_FOUND', 'User does not exist', 404);
 * }
 * ```
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400
): NextResponse<ErrorResponse> {
  return NextResponse.json<ErrorResponse>(
    {
      ok: false,
      error: { code, message },
    },
    { status }
  );
}
