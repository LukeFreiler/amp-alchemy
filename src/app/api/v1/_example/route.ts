/**
 * Example API Route Template
 *
 * This is a reference implementation showing the standard patterns for API routes.
 * Delete this file once you understand the patterns, or use it as a template.
 *
 * Key patterns demonstrated:
 * - Response envelope: { ok: true, data: ... } or { ok: false, error: ... }
 * - Error handling with logger
 * - Input validation
 * - TypeScript types for requests/responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Response envelope types
 */
type SuccessResponse<T> = {
  ok: true;
  data: T;
};

type ErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Example: Get items
 */
export async function GET(request: NextRequest) {
  try {
    // Example: Extract query params
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '10';

    // Example: Validate input
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return NextResponse.json<ErrorResponse>(
        {
          ok: false,
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit must be between 1 and 100',
          },
        },
        { status: 400 }
      );
    }

    // Example: Fetch data (replace with actual database query)
    const items = [
      { id: 1, name: 'Example Item 1' },
      { id: 2, name: 'Example Item 2' },
    ].slice(0, parsedLimit);

    // Success response
    return NextResponse.json<ApiResponse<typeof items>>({
      ok: true,
      data: items,
    });
  } catch (error) {
    // Log errors (logger auto-sanitizes sensitive data)
    logger.error('Failed to fetch items', {
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
}

/**
 * Example: Create item
 */
export async function POST(request: NextRequest) {
  try {
    // Example: Parse request body
    const body = await request.json();

    // Example: Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json<ErrorResponse>(
        {
          ok: false,
          error: {
            code: 'INVALID_NAME',
            message: 'Name is required and must be a string',
          },
        },
        { status: 400 }
      );
    }

    // Example: Create item (replace with actual database insert)
    const newItem = {
      id: 3,
      name: body.name,
      createdAt: new Date().toISOString(),
    };

    // Success response with 201 Created
    return NextResponse.json<ApiResponse<typeof newItem>>(
      {
        ok: true,
        data: newItem,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create item', {
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
}
