-- Updated Migration Script for Flexible Form Submissions
-- This version supports both "predefined routes" and "trip design" modes
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if you want to recreate (CAREFUL - this deletes data!)
-- Uncomment the lines below only if you want a fresh start
-- DROP TABLE IF EXISTS form_submissions CASCADE;
-- DROP TABLE IF EXISTS agencies CASCADE;

-- Create agencies table (unchanged)
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#059669',
  secondary_color TEXT DEFAULT '#0ea5e9',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index on subdomain for faster lookups
CREATE INDEX IF NOT EXISTS idx_agencies_subdomain ON agencies(subdomain);

-- Create flexible form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Agency reference (nullable for main domain)
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  
  -- Common fields (for all submission types) - extracted for easy querying
  client_name TEXT NOT NULL,
  num_travellers INTEGER,
  route_preference TEXT NOT NULL CHECK (route_preference IN ('predefined', 'trip-design')),
  
  -- Travel dates (can be months or specific date)
  travel_months TEXT[], -- Array of month values
  specific_date DATE,   -- Or specific start date
  
  -- Complete form data as JSON (for full flexibility)
  form_data JSONB NOT NULL,
  
  -- Mode-specific data stored as JSON
  -- For predefined routes: { selected_route: {...} }
  -- For trip design: { nights: {...}, golf: {...}, destinations: [...], etc. }
  mode_specific_data JSONB,
  
  -- Webhook tracking
  webhook_sent BOOLEAN DEFAULT FALSE,
  webhook_sent_at TIMESTAMP WITH TIME ZONE,
  webhook_response TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_agency_id ON form_submissions(agency_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_route_preference ON form_submissions(route_preference);
CREATE INDEX IF NOT EXISTS idx_form_submissions_client_name ON form_submissions(client_name);

-- Create GIN index for JSONB columns (for fast JSON queries)
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_data ON form_submissions USING GIN (form_data);
CREATE INDEX IF NOT EXISTS idx_form_submissions_mode_specific ON form_submissions USING GIN (mode_specific_data);

-- Enable Row Level Security
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agencies table
DROP POLICY IF EXISTS "Allow public read access to agencies" ON agencies;
DROP POLICY IF EXISTS "Allow authenticated users to create agencies" ON agencies;
DROP POLICY IF EXISTS "Allow authenticated users to update agencies" ON agencies;

CREATE POLICY "Allow public read access to agencies"
  ON agencies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create agencies"
  ON agencies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update agencies"
  ON agencies
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for form_submissions table
DROP POLICY IF EXISTS "Allow public to insert form submissions" ON form_submissions;
DROP POLICY IF EXISTS "Allow reading recent submissions" ON form_submissions;
DROP POLICY IF EXISTS "Allow agency owners to read their submissions" ON form_submissions;

CREATE POLICY "Allow public to insert form submissions"
  ON form_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow reading recent submissions"
  ON form_submissions
  FOR SELECT
  TO public
  USING (
    created_at > NOW() - INTERVAL '1 hour'
  );

CREATE POLICY "Allow authenticated users to read submissions"
  ON form_submissions
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE created_by = auth.uid()
    )
    OR agency_id IS NULL
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on agencies table
DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on form_submissions table
DROP TRIGGER IF EXISTS update_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER update_form_submissions_updated_at
  BEFORE UPDATE ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert a demo agency (optional)
INSERT INTO agencies (name, subdomain, logo_url, primary_color, secondary_color)
VALUES (
  'Finest Africa Demo',
  'demo',
  NULL,
  '#059669',
  '#0ea5e9'
)
ON CONFLICT (subdomain) DO NOTHING;

-- Helper view for easy querying of submissions with agency info
CREATE OR REPLACE VIEW submissions_with_agency AS
SELECT 
  fs.id,
  fs.agency_id,
  a.name as agency_name,
  a.subdomain as agency_subdomain,
  fs.client_name,
  fs.num_travellers,
  fs.route_preference,
  fs.travel_months,
  fs.specific_date,
  fs.form_data,
  fs.mode_specific_data,
  fs.webhook_sent,
  fs.created_at
FROM form_submissions fs
LEFT JOIN agencies a ON fs.agency_id = a.id;

-- Verify migration
SELECT 'Migration completed successfully!' as status;
SELECT 'Agencies table:' as info, COUNT(*) as count FROM agencies;
SELECT 'Form submissions table:' as info, COUNT(*) as count FROM form_submissions;

-- Show table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('agencies', 'form_submissions')
ORDER BY table_name, ordinal_position;

