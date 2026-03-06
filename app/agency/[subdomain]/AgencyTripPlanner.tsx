"use client";

import { useState } from "react";
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
}: AgencyTripPlannerProps) {
  const [formKey, setFormKey] = useState(0);

  // Reset the form back to step 1 with all fields cleared, without logging out
  const handleExit = () => {
    setFormKey((k) => k + 1);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        ["--agency-primary" as any]: agency.primary_color,
        ["--agency-secondary" as any]: agency.secondary_color,
      }}
    >
      <TripPlanner key={formKey} onExit={handleExit} agency={agency} />
    </div>
  );
}
