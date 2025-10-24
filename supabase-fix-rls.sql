-- Fix RLS Policy for Agency Creation
-- Run this in Supabase SQL Editor

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users to create agencies" ON agencies;

-- Create a new, more flexible policy
-- This allows any authenticated user to create agencies
CREATE POLICY "Allow authenticated users to create agencies"
  ON agencies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also update the update policy to be more flexible
DROP POLICY IF EXISTS "Allow users to update their own agencies" ON agencies;

CREATE POLICY "Allow authenticated users to update agencies"
  ON agencies
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'agencies';

