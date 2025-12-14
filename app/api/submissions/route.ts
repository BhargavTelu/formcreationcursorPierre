import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { formSubmissionSchema } from '@/lib/types';
import type { FormSubmissionApiResponse } from '@/lib/types';

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;


/**
 * GET /api/submissions?agency_id=xxx
 * Fetch form submissions for an agency
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agency_id = searchParams.get('agency_id');

    if (!agency_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'agency_id parameter is required',
        },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Fetch submissions for this agency, ordered by most recent first
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('agency_id', agency_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Database error fetching submissions:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch submissions',
          message: error.message,
        },
        { status: 500 }
      );
    }

    // Return with no-cache headers
    return NextResponse.json(
      {
        success: true,
        data: data || [],
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    console.error('[API] Error fetching submissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/submissions
 * Store form submission in Supabase
 * Handles both "predefined" and "trip-design" modes
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    console.log('[API] Received submission for mode:', body.form_data?.routePreference);

    // Validate input with Zod (automatically validates based on mode)
    const validation = formSubmissionSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      console.error('[API] Validation failed:', errors);

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: errors[0].message,
          errors,
        } as FormSubmissionApiResponse,
        { status: 400 }
      );
    }

    const { agency_id, form_data } = validation.data;

    // Extract common fields
    const client_name = form_data.clientName;
    const num_travellers = parseInt(form_data.numTravellers) || null;
    const route_preference = form_data.routePreference;

    // Create Supabase client
    const supabase = createServerSupabaseClient();

    // Prepare submission data - only use columns that exist in the database
    // All additional data (travel_months, specific_date, mode_specific) is stored in form_data JSONB
    const submissionData = {
      agency_id: agency_id || null,
      client_name,
      num_travellers,
      route_preference,
      form_data: form_data as any, // Complete form data (includes everything)
      webhook_sent: false,
    };

    console.log('[API] Inserting submission:', {
      agency_id: submissionData.agency_id,
      client_name: submissionData.client_name,
      num_travellers: submissionData.num_travellers,
      route_preference: submissionData.route_preference,
      form_data: '[FORM_DATA]',
    });

    // Insert into database
    const { data, error } = await supabase
      .from('form_submissions')
      .insert(submissionData)
      .select('id')
      .single();

    if (error) {
      console.error('[API] Database error inserting form submission:', error);
      console.error('[API] Error code:', error.code);
      console.error('[API] Error details:', error.details);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save form submission',
          message: error.message,
        } as FormSubmissionApiResponse,
        { status: 500 }
      );
    }

    console.log(`[API] Form submission saved successfully with ID: ${data.id}`);

    return NextResponse.json(
      {
        success: true,
        data: { id: data.id },
        message: 'Form submission saved successfully',
      } as FormSubmissionApiResponse,
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API] Error processing form submission:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      } as FormSubmissionApiResponse,
      { status: 500 }
    );
  }
}


