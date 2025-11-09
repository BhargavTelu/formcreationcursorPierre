import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { formSubmissionSchema, type FormData, type PredefinedRouteData, type TripDesignData } from '@/lib/types';
import type { FormSubmissionApiResponse } from '@/lib/types';

/**
 * Extract mode-specific data based on route preference
 */
function extractModeSpecificData(formData: FormData): Record<string, any> {
  if (formData.routePreference === 'predefined') {
    const data = formData as PredefinedRouteData;
    return {
      selectedRoute: data.selectedRoute,
    };
  } else {
    const data = formData as TripDesignData;
    return {
      nightsPreference: data.nightsPreference || null,
      golfInfo: data.golfInfo || null,
      destinations: data.destinations || [],
      travelLevel: data.travelLevel || null,
      accommodationType: data.accommodationType || null,
      generalNotes: data.generalNotes || null,
    };
  }
}

/**
 * Extract travel dates from form data
 */
function extractTravelDates(formData: FormData): {
  travel_months: string[] | null;
  specific_date: string | null;
} {
  // Extract month values if present
  const travel_months = formData.travelMonths && formData.travelMonths.length > 0
    ? formData.travelMonths.map(m => m.value)
    : null;

  // Extract specific date if present (convert to DATE format)
  const specific_date = formData.specificDate || null;

  return { travel_months, specific_date };
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

    // Extract travel dates
    const { travel_months, specific_date } = extractTravelDates(form_data);

    // Extract mode-specific data
    const mode_specific_data = extractModeSpecificData(form_data);

    // Create Supabase client
    const supabase = createServerSupabaseClient();

    // Prepare submission data
    const submissionData = {
      agency_id: agency_id || null,
      client_name,
      num_travellers,
      route_preference,
      travel_months,
      specific_date,
      form_data: form_data as any, // Complete form data
      mode_specific_data, // Mode-specific fields
      webhook_sent: false,
    };

    console.log('[API] Inserting submission:', {
      ...submissionData,
      form_data: '[FORM_DATA]', // Don't log full data
      mode_specific_data: '[MODE_SPECIFIC]',
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


