import { z } from 'zod';

// ==================== Profile Types ====================

export type ProfileRole = 'admin' | 'pending_invite';

export interface Profile {
  id: string;
  email: string;
  role: ProfileRole;
  invited_by: string | null;
  invited_at: string | null;
  activated_at: string | null;
  created_at?: string;
  updated_at?: string;
}

// ==================== Agency Types ====================

export interface Agency {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Zod schema for agency creation
export const createAgencySchema = z.object({
  name: z.string().min(2, 'Agency name must be at least 2 characters').max(100),
  subdomain: z
    .string()
    .min(2, 'Subdomain must be at least 2 characters')
    .max(63, 'Subdomain must be at most 63 characters')
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      'Subdomain must contain only lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.'
    )
    .refine(
      (val) => !['www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost'].includes(val),
      'This subdomain is reserved'
    ),
  email: z.string().email('Must be a valid email address'),
  logo_url: z.string().url('Must be a valid URL').optional().nullable(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #059669)')
    .default('#059669'),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #0ea5e9)')
    .default('#0ea5e9'),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;

// ==================== Form Submission Types ====================

export interface FormSubmission {
  id: string;
  agency_id: string | null;
  client_name: string;
  num_travellers: number | null;
  route_preference: 'predefined' | 'trip-design';
  travel_months: string[] | null;
  specific_date: string | null;
  form_data: Record<string, any>; // Complete form data
  mode_specific_data: Record<string, any> | null; // Mode-specific fields
  webhook_sent: boolean;
  webhook_sent_at: string | null;
  webhook_response: string | null;
  created_at: string;
  updated_at: string;
}

// Common form data (present in both modes)
export interface CommonFormData {
  clientName: string;
  numTravellers: string;
  travelMonths?: Array<{ value: string; text: string }>;
  specificDate?: string;
  routePreference: 'predefined' | 'trip-design';
  timestamp: string;
}

// Predefined routes mode data
export interface PredefinedRouteData extends CommonFormData {
  routePreference: 'predefined';
  selectedRoute: { value: string; text: string };
}

// Trip design mode data
export interface TripDesignData extends CommonFormData {
  routePreference: 'trip-design';
  nightsPreference?: { type: 'exact' | 'range'; value: string; text: string } | null;
  golfInfo?: { isGolfTrip: boolean; rounds: string | null } | null;
  destinations?: Array<any>;
  travelLevel?: { value: string; text: string } | null;
  accommodationType?: { value: string; text: string } | null;
  generalNotes?: string;
}

// Union type for all form data
export type FormData = PredefinedRouteData | TripDesignData;

// Zod schema for common fields
const commonFormDataSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  numTravellers: z.string(),
  travelMonths: z.array(z.object({ value: z.string(), text: z.string() })).optional(),
  specificDate: z.string().optional(),
  timestamp: z.string(),
});

// Zod schema for predefined route mode
const predefinedRouteSchema = commonFormDataSchema.extend({
  routePreference: z.literal('predefined'),
  selectedRoute: z.object({ 
    value: z.string(), 
    text: z.string() 
  }),
});

// Zod schema for trip design mode
const tripDesignSchema = commonFormDataSchema.extend({
  routePreference: z.literal('trip-design'),
  nightsPreference: z
    .object({
      type: z.enum(['exact', 'range']),
      value: z.string(),
      text: z.string(),
    })
    .nullable()
    .optional(),
  golfInfo: z
    .object({
      isGolfTrip: z.boolean(),
      rounds: z.string().nullable(),
    })
    .nullable()
    .optional(),
  destinations: z.array(z.any()).optional(),
  travelLevel: z.object({ value: z.string(), text: z.string() }).nullable().optional(),
  accommodationType: z.object({ value: z.string(), text: z.string() }).nullable().optional(),
  generalNotes: z.string().optional(),
});

// Union schema that validates both modes
export const formDataSchema = z.discriminatedUnion('routePreference', [
  predefinedRouteSchema,
  tripDesignSchema,
]);

// Zod schema for form submission API
export const formSubmissionSchema = z.object({
  agency_id: z.string().uuid().nullable().optional(),
  form_data: formDataSchema,
});

export type CreateFormSubmissionInput = z.infer<typeof formSubmissionSchema>;

// ==================== API Response Types ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AgencyApiResponse extends ApiResponse<Agency> {}

export interface FormSubmissionApiResponse extends ApiResponse<{ id: string }> {}


