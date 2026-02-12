"use client";

import { useRouter } from "next/navigation";
import TripPlanner from "@/app/ui-new/components/PlanningForm/TripPlanner";

interface Agency {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

interface AgencyTripPlannerProps {
  agency: Agency;
  subdomain: string;
}

export default function AgencyTripPlanner({
  agency,
  subdomain,
}: AgencyTripPlannerProps) {
  const router = useRouter();

  const handleExit = () => {
    router.push(`/agency/${subdomain}/submissions` as any);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        // Set CSS variables for agency branding
        ["--agency-primary" as any]: agency.primary_color,
        ["--agency-secondary" as any]: agency.secondary_color,
      }}
    >
      <TripPlanner onExit={handleExit} agency={agency} />
    </div>
  );
}
