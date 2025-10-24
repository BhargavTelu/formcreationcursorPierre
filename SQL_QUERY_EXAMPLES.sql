-- SQL Query Examples for Flexible Form Submissions
-- Use these in Supabase SQL Editor or in your application

-- ========================================
-- BASIC QUERIES
-- ========================================

-- Get all submissions
SELECT * FROM form_submissions
ORDER BY created_at DESC
LIMIT 10;

-- Get submissions with agency info
SELECT 
  fs.*,
  a.name as agency_name,
  a.subdomain as agency_subdomain
FROM form_submissions fs
LEFT JOIN agencies a ON fs.agency_id = a.id
ORDER BY fs.created_at DESC;

-- Use the helper view (easier!)
SELECT * FROM submissions_with_agency
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- FILTER BY MODE
-- ========================================

-- Get all predefined route submissions
SELECT * FROM form_submissions
WHERE route_preference = 'predefined'
ORDER BY created_at DESC;

-- Get all trip design submissions
SELECT * FROM form_submissions
WHERE route_preference = 'trip-design'
ORDER BY created_at DESC;

-- ========================================
-- PREDEFINED ROUTES QUERIES
-- ========================================

-- Get submissions for a specific route
SELECT 
  client_name,
  num_travellers,
  mode_specific_data->>'selectedRoute' as selected_route,
  created_at
FROM form_submissions
WHERE route_preference = 'predefined'
  AND mode_specific_data->'selectedRoute'->>'value' = 'route1'
ORDER BY created_at DESC;

-- Count submissions per route
SELECT 
  mode_specific_data->'selectedRoute'->>'text' as route_name,
  COUNT(*) as submission_count
FROM form_submissions
WHERE route_preference = 'predefined'
GROUP BY mode_specific_data->'selectedRoute'->>'text'
ORDER BY submission_count DESC;

-- ========================================
-- TRIP DESIGN QUERIES
-- ========================================

-- Get golf trip submissions
SELECT 
  client_name,
  num_travellers,
  mode_specific_data->'golfInfo'->>'rounds' as golf_rounds,
  created_at
FROM form_submissions
WHERE route_preference = 'trip-design'
  AND mode_specific_data->'golfInfo'->>'isGolfTrip' = 'true'
ORDER BY created_at DESC;

-- Get submissions by travel level
SELECT 
  client_name,
  mode_specific_data->'travelLevel'->>'text' as travel_level,
  created_at
FROM form_submissions
WHERE route_preference = 'trip-design'
  AND mode_specific_data->'travelLevel'->>'value' = 'luxury'
ORDER BY created_at DESC;

-- Get submissions by accommodation type
SELECT 
  client_name,
  mode_specific_data->'accommodationType'->>'text' as accommodation,
  created_at
FROM form_submissions
WHERE route_preference = 'trip-design'
  AND mode_specific_data->'accommodationType'->>'value' = '5-star'
ORDER BY created_at DESC;

-- Get submissions with specific number of nights
SELECT 
  client_name,
  mode_specific_data->'nightsPreference'->>'text' as nights,
  created_at
FROM form_submissions
WHERE route_preference = 'trip-design'
  AND mode_specific_data->'nightsPreference'->>'value' = '14-nights'
ORDER BY created_at DESC;

-- ========================================
-- TRAVEL DATE QUERIES
-- ========================================

-- Get submissions for a specific month
SELECT * FROM form_submissions
WHERE '2024-10' = ANY(travel_months)
ORDER BY created_at DESC;

-- Get submissions with specific date
SELECT * FROM form_submissions
WHERE specific_date IS NOT NULL
  AND specific_date BETWEEN '2024-10-01' AND '2024-10-31'
ORDER BY specific_date ASC;

-- Get submissions with any travel date in next 30 days
SELECT * FROM form_submissions
WHERE specific_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY specific_date ASC;

-- Get submissions by multiple months
SELECT * FROM form_submissions
WHERE travel_months && ARRAY['2024-10', '2024-11']::TEXT[]
ORDER BY created_at DESC;

-- ========================================
-- AGENCY-SPECIFIC QUERIES
-- ========================================

-- Get submissions for a specific agency
SELECT * FROM form_submissions
WHERE agency_id = 'your-agency-uuid-here'
ORDER BY created_at DESC;

-- Get submissions from main domain (no agency)
SELECT * FROM form_submissions
WHERE agency_id IS NULL
ORDER BY created_at DESC;

-- Count submissions per agency
SELECT 
  a.name as agency_name,
  a.subdomain,
  COUNT(fs.id) as submission_count
FROM agencies a
LEFT JOIN form_submissions fs ON fs.agency_id = a.id
GROUP BY a.id, a.name, a.subdomain
ORDER BY submission_count DESC;

-- ========================================
-- STATISTICS QUERIES
-- ========================================

-- Overall statistics
SELECT 
  COUNT(*) as total_submissions,
  COUNT(*) FILTER (WHERE route_preference = 'predefined') as predefined_count,
  COUNT(*) FILTER (WHERE route_preference = 'trip-design') as trip_design_count,
  COUNT(*) FILTER (WHERE route_preference = 'trip-design' 
    AND mode_specific_data->'golfInfo'->>'isGolfTrip' = 'true') as golf_trip_count
FROM form_submissions;

-- Submissions by month
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as submission_count
FROM form_submissions
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Submissions by day (last 7 days)
SELECT 
  DATE(created_at) as day,
  COUNT(*) as submission_count
FROM form_submissions
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY day DESC;

-- Average travelers per submission
SELECT 
  route_preference,
  AVG(num_travellers) as avg_travellers,
  MIN(num_travellers) as min_travellers,
  MAX(num_travellers) as max_travellers
FROM form_submissions
WHERE num_travellers IS NOT NULL
GROUP BY route_preference;

-- ========================================
-- SEARCH QUERIES
-- ========================================

-- Search by client name (case-insensitive)
SELECT * FROM form_submissions
WHERE client_name ILIKE '%smith%'
ORDER BY created_at DESC;

-- Search in general notes
SELECT 
  client_name,
  mode_specific_data->>'generalNotes' as notes,
  created_at
FROM form_submissions
WHERE route_preference = 'trip-design'
  AND mode_specific_data->>'generalNotes' ILIKE '%wine%'
ORDER BY created_at DESC;

-- Full text search in form data (requires tsvector)
-- Note: This searches the entire JSON
SELECT * FROM form_submissions
WHERE form_data::text ILIKE '%kruger%'
ORDER BY created_at DESC;

-- ========================================
-- DESTINATION QUERIES
-- ========================================

-- Get submissions with specific destination
SELECT 
  client_name,
  mode_specific_data->'destinations' as destinations,
  created_at
FROM form_submissions
WHERE route_preference = 'trip-design'
  AND mode_specific_data->'destinations'::text LIKE '%cape-town%'
ORDER BY created_at DESC;

-- Count popular destinations
SELECT 
  jsonb_array_elements(mode_specific_data->'destinations')->>'name' as destination,
  COUNT(*) as popularity
FROM form_submissions
WHERE route_preference = 'trip-design'
  AND mode_specific_data->'destinations' IS NOT NULL
GROUP BY jsonb_array_elements(mode_specific_data->'destinations')->>'name'
ORDER BY popularity DESC
LIMIT 10;

-- ========================================
-- WEBHOOK STATUS QUERIES
-- ========================================

-- Get submissions where webhook failed
SELECT * FROM form_submissions
WHERE webhook_sent = false
  AND created_at < NOW() - INTERVAL '5 minutes'
ORDER BY created_at ASC;

-- Get successfully sent webhooks
SELECT * FROM form_submissions
WHERE webhook_sent = true
ORDER BY webhook_sent_at DESC
LIMIT 10;

-- Webhook success rate
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE webhook_sent = true) as sent,
  ROUND(100.0 * COUNT(*) FILTER (WHERE webhook_sent = true) / COUNT(*), 2) as success_rate
FROM form_submissions;

-- ========================================
-- RECENT ACTIVITY
-- ========================================

-- Get submissions from last 24 hours
SELECT * FROM form_submissions
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Get submissions from this week
SELECT * FROM form_submissions
WHERE created_at >= DATE_TRUNC('week', NOW())
ORDER BY created_at DESC;

-- Get submissions from this month
SELECT * FROM form_submissions
WHERE created_at >= DATE_TRUNC('month', NOW())
ORDER BY created_at DESC;

-- ========================================
-- COMPLEX ANALYTICS
-- ========================================

-- Popular travel months
SELECT 
  UNNEST(travel_months) as month,
  COUNT(*) as count
FROM form_submissions
WHERE travel_months IS NOT NULL
GROUP BY month
ORDER BY count DESC;

-- Travel level distribution (trip design only)
SELECT 
  mode_specific_data->'travelLevel'->>'text' as travel_level,
  COUNT(*) as count
FROM form_submissions
WHERE route_preference = 'trip-design'
  AND mode_specific_data->'travelLevel' IS NOT NULL
GROUP BY mode_specific_data->'travelLevel'->>'text'
ORDER BY count DESC;

-- Golf rounds distribution
SELECT 
  mode_specific_data->'golfInfo'->>'rounds' as rounds,
  COUNT(*) as count
FROM form_submissions
WHERE route_preference = 'trip-design'
  AND mode_specific_data->'golfInfo'->>'isGolfTrip' = 'true'
  AND mode_specific_data->'golfInfo'->>'rounds' IS NOT NULL
GROUP BY mode_specific_data->'golfInfo'->>'rounds'
ORDER BY count DESC;

-- ========================================
-- DATA EXPORT QUERIES
-- ========================================

-- Export for Excel/CSV (simplified view)
SELECT 
  id,
  client_name,
  num_travellers,
  route_preference,
  CASE 
    WHEN route_preference = 'predefined' 
    THEN mode_specific_data->'selectedRoute'->>'text'
    ELSE 'Custom Trip'
  END as trip_type,
  array_to_string(travel_months, ', ') as travel_months,
  specific_date,
  created_at::date as submission_date
FROM form_submissions
ORDER BY created_at DESC;

-- Export trip design details
SELECT 
  client_name,
  num_travellers,
  mode_specific_data->'nightsPreference'->>'text' as nights,
  mode_specific_data->'travelLevel'->>'text' as travel_level,
  mode_specific_data->'accommodationType'->>'text' as accommodation,
  mode_specific_data->'golfInfo'->>'isGolfTrip' as has_golf,
  mode_specific_data->>'generalNotes' as notes,
  created_at
FROM form_submissions
WHERE route_preference = 'trip-design'
ORDER BY created_at DESC;

-- ========================================
-- MAINTENANCE QUERIES
-- ========================================

-- Check for null/invalid data
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE client_name IS NULL OR client_name = '') as missing_name,
  COUNT(*) FILTER (WHERE form_data IS NULL) as missing_form_data,
  COUNT(*) FILTER (WHERE mode_specific_data IS NULL) as missing_mode_data
FROM form_submissions;

-- Find orphaned submissions (agency deleted)
SELECT fs.* 
FROM form_submissions fs
LEFT JOIN agencies a ON fs.agency_id = a.id
WHERE fs.agency_id IS NOT NULL
  AND a.id IS NULL;

-- Database size and row counts
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_live_tup as rows
FROM pg_stat_user_tables
WHERE tablename IN ('form_submissions', 'agencies')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

