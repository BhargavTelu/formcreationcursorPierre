-- =====================================================
-- FIX INVITATIONS TABLE SCHEMA
-- This adds all missing columns required by the code
-- =====================================================

-- Step 1: Drop and recreate the invitations table with correct schema
DROP TABLE IF EXISTS public.invitations CASCADE;

CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')) DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);

-- Step 3: Create updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invitations_updated_at ON public.invitations;
CREATE TRIGGER trg_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Step 4: Set up RLS policies
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Invitations: admin manage" ON public.invitations;
DROP POLICY IF EXISTS "invitations_admin_all" ON public.invitations;

-- Create admin-only policy
CREATE POLICY "invitations_admin_all"
  ON public.invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 5: Verify the table structure
SELECT 
  '✅ Invitations table recreated' AS status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'invitations' AND table_schema = 'public') AS column_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'invitations' AND schemaname = 'public') AS index_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'invitations' AND schemaname = 'public') AS policy_count;

-- Step 6: Show all columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invitations'
ORDER BY ordinal_position;

