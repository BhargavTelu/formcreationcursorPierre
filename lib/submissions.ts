import { createServerSupabaseClient } from './supabase';
import type { FormSubmission } from './types';

/**
 * Utility functions for querying form submissions
 * Handles both "predefined" and "trip-design" modes
 */

/**
 * Get all submissions for an agency
 */
export async function getAgencySubmissions(
  agencyId: string,
  options?: {
    limit?: number;
    offset?: number;
    routePreference?: 'predefined' | 'trip-design';
  }
): Promise<{ data: FormSubmission[]; count: number | null; error: any }> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('form_submissions')
    .select('*', { count: 'exact' })
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (options?.routePreference) {
    query = query.eq('route_preference', options.routePreference);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, count, error } = await query;

  return {
    data: (data || []) as FormSubmission[],
    count,
    error,
  };
}

/**
 * Get submissions by client name (for searching)
 */
export async function searchSubmissionsByClient(
  clientName: string,
  agencyId?: string
): Promise<FormSubmission[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('form_submissions')
    .select('*')
    .ilike('client_name', `%${clientName}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (agencyId) {
    query = query.eq('agency_id', agencyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Submissions] Error searching submissions:', error);
    return [];
  }

  return (data || []) as FormSubmission[];
}

/**
 * Get submissions for a specific month
 */
export async function getSubmissionsByMonth(
  month: string, // Format: "2024-10"
  agencyId?: string
): Promise<FormSubmission[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('form_submissions')
    .select('*')
    .contains('travel_months', [month])
    .order('created_at', { ascending: false });

  if (agencyId) {
    query = query.eq('agency_id', agencyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Submissions] Error getting submissions by month:', error);
    return [];
  }

  return (data || []) as FormSubmission[];
}

/**
 * Get submissions with specific travel dates
 */
export async function getSubmissionsByDateRange(
  startDate: string,
  endDate: string,
  agencyId?: string
): Promise<FormSubmission[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('form_submissions')
    .select('*')
    .gte('specific_date', startDate)
    .lte('specific_date', endDate)
    .order('specific_date', { ascending: true });

  if (agencyId) {
    query = query.eq('agency_id', agencyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Submissions] Error getting submissions by date range:', error);
    return [];
  }

  return (data || []) as FormSubmission[];
}

/**
 * Get submissions by route preference
 */
export async function getSubmissionsByMode(
  mode: 'predefined' | 'trip-design',
  agencyId?: string,
  limit: number = 100
): Promise<FormSubmission[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('form_submissions')
    .select('*')
    .eq('route_preference', mode)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (agencyId) {
    query = query.eq('agency_id', agencyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Submissions] Error getting submissions by mode:', error);
    return [];
  }

  return (data || []) as FormSubmission[];
}

/**
 * Get predefined route submissions with specific route
 */
export async function getPredefinedRouteSubmissions(
  routeId: string,
  agencyId?: string
): Promise<FormSubmission[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('form_submissions')
    .select('*')
    .eq('route_preference', 'predefined')
    .filter('mode_specific_data->selectedRoute->>value', 'eq', routeId)
    .order('created_at', { ascending: false });

  if (agencyId) {
    query = query.eq('agency_id', agencyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Submissions] Error getting predefined route submissions:', error);
    return [];
  }

  return (data || []) as FormSubmission[];
}

/**
 * Get trip design submissions with golf
 */
export async function getGolfTripSubmissions(
  agencyId?: string
): Promise<FormSubmission[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('form_submissions')
    .select('*')
    .eq('route_preference', 'trip-design')
    .filter('mode_specific_data->golfInfo->>isGolfTrip', 'eq', 'true')
    .order('created_at', { ascending: false });

  if (agencyId) {
    query = query.eq('agency_id', agencyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Submissions] Error getting golf trip submissions:', error);
    return [];
  }

  return (data || []) as FormSubmission[];
}

/**
 * Get submission statistics for an agency
 */
export async function getSubmissionStats(agencyId?: string): Promise<{
  total: number;
  predefined: number;
  tripDesign: number;
  withGolf: number;
  thisMonth: number;
}> {
  const supabase = createServerSupabaseClient();

  // Get total count
  let totalQuery = supabase
    .from('form_submissions')
    .select('*', { count: 'exact', head: true });

  if (agencyId) {
    totalQuery = totalQuery.eq('agency_id', agencyId);
  }

  const { count: total } = await totalQuery;

  // Get predefined count
  let predefinedQuery = supabase
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('route_preference', 'predefined');

  if (agencyId) {
    predefinedQuery = predefinedQuery.eq('agency_id', agencyId);
  }

  const { count: predefined } = await predefinedQuery;

  // Get trip design count
  let tripDesignQuery = supabase
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('route_preference', 'trip-design');

  if (agencyId) {
    tripDesignQuery = tripDesignQuery.eq('agency_id', agencyId);
  }

  const { count: tripDesign } = await tripDesignQuery;

  // Get golf trips count
  let golfQuery = supabase
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('route_preference', 'trip-design')
    .filter('mode_specific_data->golfInfo->>isGolfTrip', 'eq', 'true');

  if (agencyId) {
    golfQuery = golfQuery.eq('agency_id', agencyId);
  }

  const { count: withGolf } = await golfQuery;

  // Get this month's count
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  let monthQuery = supabase
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString());

  if (agencyId) {
    monthQuery = monthQuery.eq('agency_id', agencyId);
  }

  const { count: thisMonth } = await monthQuery;

  return {
    total: total || 0,
    predefined: predefined || 0,
    tripDesign: tripDesign || 0,
    withGolf: withGolf || 0,
    thisMonth: thisMonth || 0,
  };
}

/**
 * Mark webhook as sent for a submission
 */
export async function markWebhookSent(
  submissionId: string,
  success: boolean,
  response?: string
): Promise<boolean> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from('form_submissions')
    .update({
      webhook_sent: success,
      webhook_sent_at: new Date().toISOString(),
      webhook_response: response || null,
    })
    .eq('id', submissionId);

  if (error) {
    console.error('[Submissions] Error marking webhook as sent:', error);
    return false;
  }

  return true;
}

