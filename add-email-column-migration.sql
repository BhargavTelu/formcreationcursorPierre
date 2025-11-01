-- Migration: Add email column to agencies table
-- Run this in Supabase SQL Editor
-- 
-- This adds an email column to the agencies table for agency contact information

-- Add email column to agencies table
ALTER TABLE agencies 
ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';

-- Update existing records (if any) with a placeholder email
-- IMPORTANT: Replace 'contact@agency.com' with actual emails for your existing agencies
UPDATE agencies 
SET email = 'contact@agency.com' 
WHERE email = '';

