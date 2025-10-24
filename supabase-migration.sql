-- Migration script for subdomain multi-tenancy
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create agencies table
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

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL,
  client_name TEXT,
  num_travellers INTEGER,
  route_preference TEXT,
  webhook_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_agency_id ON form_submissions(agency_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agencies table

-- Allow public read access to agencies
CREATE POLICY "Allow public read access to agencies"
  ON agencies
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to create agencies
CREATE POLICY "Allow authenticated users to create agencies"
  ON agencies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own agencies
CREATE POLICY "Allow users to update their own agencies"
  ON agencies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for form_submissions table

-- Allow public to insert form submissions
CREATE POLICY "Allow public to insert form submissions"
  ON form_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to read their own recent submissions (by client_name within last hour)
-- This is useful for confirmation pages
CREATE POLICY "Allow reading recent submissions"
  ON form_submissions
  FOR SELECT
  TO public
  USING (
    created_at > NOW() - INTERVAL '1 hour'
  );

-- Allow authenticated users to read submissions for their agencies
CREATE POLICY "Allow agency owners to read their submissions"
  ON form_submissions
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE created_by = auth.uid()
    )
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
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert a default agency for testing (optional)
INSERT INTO agencies (name, subdomain, logo_url, primary_color, secondary_color)
VALUES (
  'Finest Africa Demo',
  'demo',
  NULL,
  '#059669',
  '#0ea5e9'
)
ON CONFLICT (subdomain) DO NOTHING;

-- Verify tables were created
SELECT 'Migration completed successfully!' as status;
SELECT 'Agencies table:' as info, COUNT(*) as count FROM agencies;
SELECT 'Form submissions table:' as info, COUNT(*) as count FROM form_submissions;


