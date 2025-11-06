-- =====================================================
-- FIX INVITATIONS TABLE - Remove NOT NULL Constraint
-- Run this BEFORE running bootstrap-first-admin.sql
-- =====================================================

-- Step 1: Make invited_by column nullable
ALTER TABLE invitations ALTER COLUMN invited_by DROP NOT NULL;

-- Step 2: Verify the change
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'invitations' 
  AND column_name = 'invited_by';

-- Should show: is_nullable = 'YES'

-- Step 3: Test that NULL values work now
SELECT 'Fix applied successfully! You can now run bootstrap-first-admin.sql' as status;

