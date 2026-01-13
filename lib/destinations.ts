import { supabase } from "@/lib/supabase";

export interface DestinationLite {
  id: string;
  name: string;
  image_url: string | null;
  parent_id: string | null;
}

export async function fetchAllDestinations(): Promise<DestinationLite[]> {
  const { data, error } = await supabase
    .from("destinations")
    .select("id, name, image_url, parent_id")
    .order("name");

  if (error) {
    console.error("Failed to fetch destinations", error);
    throw error;
  }

  return data ?? [];
}
