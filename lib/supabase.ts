import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jiosxmvocybjwomejymg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppb3N4bXZvY3liandvbWVqeW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTg2NjQsImV4cCI6MjA3NDk5NDY2NH0.y6Xl5BPnRlU-nZMkSmq-L1tKb9YZKuO_90jOq1jDK2k';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for our Supabase tables
export interface Destination {
  id: string;
  name: string;
  parent_id: string | null;
  image_url: string;
  created_at?: string;
  updated_at?: string;
}

export interface Hotel {
  id: string;
  name: string;
  destination_id: string;  // Points to destinations.id (subregion)
  image_url: string;
  created_at?: string;
  updated_at?: string;
}
