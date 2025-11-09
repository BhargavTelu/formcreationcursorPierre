-- =============================================================
-- Agency Authentication System Update
-- Simplifies to one user per agency (removes role system)
-- Run this script in the Supabase SQL editor if you already ran agency-auth-schema.sql
-- =============================================================

-- Drop the role column if it exists
ALTER TABLE agency_users DROP COLUMN IF EXISTS role;

-- Add unique constraint on agency_id to ensure only one user per agency
-- First, drop existing unique constraint if it exists
ALTER TABLE agency_users DROP CONSTRAINT IF EXISTS agency_users_agency_id_key;

-- Add unique constraint on agency_id
ALTER TABLE agency_users ADD CONSTRAINT agency_users_agency_id_unique UNIQUE (agency_id);

-- Update the helper function to remove role
CREATE OR REPLACE FUNCTION get_agency_user_with_agency(p_user_email TEXT, p_agency_id UUID)
RETURNS TABLE (
  user_id UUID,
  agency_id UUID,
  email TEXT,
  name TEXT,
  is_active BOOLEAN,
  agency_name TEXT,
  agency_subdomain TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.agency_id,
    au.email,
    au.name,
    au.is_active,
    a.name as agency_name,
    a.subdomain as agency_subdomain
  FROM agency_users au
  JOIN agencies a ON a.id = au.agency_id
  WHERE au.email = LOWER(p_user_email)
    AND au.agency_id = p_agency_id
    AND au.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comments
COMMENT ON TABLE agency_users IS 'Stores agency login credentials - one user per agency';
COMMENT ON COLUMN agency_users.agency_id IS 'Unique constraint ensures only one user per agency';

