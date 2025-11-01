import { NextRequest, NextResponse } from 'next/server';
import slugify from 'slugify';
import { createAgency, invalidateAgencyCache, getAllAgencies } from '@/lib/agency';
import { getCurrentUser, createAuthenticatedSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/admin';
import { createAgencySchema } from '@/lib/types';
import type { AgencyApiResponse } from '@/lib/types';

/**
 * GET /api/admin/agencies
 * List all agencies (requires super admin authentication)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is super admin
    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Only super admins can view agencies.' },
        { status: 403 }
      );
    }

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
 * Create a new agency (requires super admin authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // Create authenticated Supabase client
    const supabaseClient = await createAuthenticatedSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('[API] Authentication error:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to create agencies.' } as AgencyApiResponse,
        { status: 401 }
      );
    }

    console.log('[API] Authenticated user:', user.email, 'ID:', user.id);

    // Check if user is super admin
    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forbidden. Only super admins can create agencies.' 
        } as AgencyApiResponse,
        { status: 403 }
      );
    }

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


