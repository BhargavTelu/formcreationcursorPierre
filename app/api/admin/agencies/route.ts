import { NextRequest, NextResponse } from 'next/server';
import slugify from 'slugify';
import { createAgency, invalidateAgencyCache, getAllAgencies } from '@/lib/agency';
import { createAgencySchema } from '@/lib/types';
import type { AgencyApiResponse } from '@/lib/types';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/agencies
 * List all agencies (requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const agencies = await getAllAgencies();

    return NextResponse.json({
      success: true,
      data: agencies,
    });
  } catch (error) {
    console.error('[API] Error fetching agencies:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/agencies
 * Create a new agency (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    const { client: supabaseClient, user } = await requireAdmin();

    console.log('[API] Authenticated user:', user.email, 'ID:', user.id);

    // Parse request body
    const body = await request.json();

    // Auto-generate subdomain from name if not provided
    if (!body.subdomain && body.name) {
      body.subdomain = slugify(body.name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
      });
    }

    // Validate input with Zod
    const validation = createAgencySchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: errors[0].message,
          errors,
        } as AgencyApiResponse,
        { status: 400 }
      );
    }

    const { name, subdomain, email, logo_url, primary_color, secondary_color } = validation.data;

    console.log('[API] Creating agency with authenticated client...');

    // Create agency with authenticated Supabase client
    const result = await createAgency({
      name,
      subdomain,
      email,
      logo_url: logo_url || null,
      primary_color,
      secondary_color,
      created_by: user.id,
    }, supabaseClient);  // Pass the authenticated client

    if (!result.success) {
      console.error('[API] Failed to create agency:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create agency',
        } as AgencyApiResponse,
        { status: 400 }
      );
    }

    console.log('[API] Agency created successfully:', result.agency?.id);

    // Create initial agency user (owner) with the agency email
    if (result.agency) {
      const { createAgencyUser } = await import('@/lib/agency-auth');
      
      // Generate a secure random password for the initial user
      const crypto = await import('crypto');
      const initialPassword = crypto.randomBytes(16).toString('hex');
      
      const userResult = await createAgencyUser(
        result.agency.id,
        email, // Use agency email as initial user email
        initialPassword,
        undefined, // No name initially
        user.id // Created by admin
      );

      if (userResult.success) {
        console.log('[API] Agency user created:', userResult.user?.id);
        // In production, you might want to send the password via email
        // For now, we'll include it in the response (admin should save it)
        return NextResponse.json(
          {
            success: true,
            data: result.agency,
            message: 'Agency created successfully',
            initial_user: {
              email,
              password: initialPassword, // Admin should save this
            },
          } as AgencyApiResponse & { initial_user?: { email: string; password: string } },
          { status: 201 }
        );
      } else {
        console.warn('[API] Agency created but failed to create user:', userResult.error);
        // Still return success, but warn about user creation
      }
    }

    // Invalidate any existing cache for this subdomain
    await invalidateAgencyCache(subdomain);

    return NextResponse.json(
      {
        success: true,
        data: result.agency,
        message: 'Agency created successfully',
      } as AgencyApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error creating agency:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as AgencyApiResponse,
      { status: 500 }
    );
  }
}


