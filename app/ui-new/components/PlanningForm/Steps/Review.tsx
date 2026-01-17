"use client";

import { useEffect, useMemo, useState } from "react";
import { StepWrapper } from "../StepWrapper";
import { TripData } from "../../../types/TripPlanner";
import { supabase } from "@/lib/supabase";
import {
  User,
  Users,
  Calendar,
  Route,
  Clock,
  MapPin,
  Sparkles,
  Home,
  Gauge,
  Flag, // ✅ FIX: Lucide-supported icon
  Pencil,
} from "lucide-react";

/* ================= TYPES ================= */

interface ReviewStepProps {
  data: TripData;
  goToStep: (id: string, fromReview?: boolean) => void;
}

interface DestinationRow {
  id: string;
  name: string;
}

/* ================= LABELS ================= */

const EXPERIENCE_LABELS: Record<string, string> = {
  beach: "Beach & Coast",
  nature: "Nature & Scenic",
  safari: "Safari & Wildlife",
  "food-wine": "Food & Wine",
  city: "City & Culture",
  adventure: "Adventure",
  history: "History & Local Life",
};

const ACCOMMODATION_LABELS: Record<string, string> = {
  boutique: "Boutique hotel",
  lodges: "Safari lodge",
  guesthouse: "Guesthouse / B&B",
  hotel: "Hotel with bar & pool",
};

const PACE_LABELS: Record<string, string> = {
  relaxed: "Unhurried",
  balanced: "Balanced",
  active: "Full days",
};

/* ================= ROW ================= */

function Row({
  icon: Icon,
  label,
  value,
  onEdit,
}: {
  icon: any;
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="group flex items-start gap-4 py-4 border-b last:border-b-0">
      <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-stone-500" />
      </div>

      <div className="flex-1">
        <p className="text-xs text-stone-500">{label}</p>
        <p className="text-sm font-medium whitespace-pre-line">{value}</p>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 transition text-stone-400 hover:text-stone-600"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ================= MAIN ================= */

export default function Review({ data, goToStep }: ReviewStepProps) {
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);

  /* ---------- FETCH DESTINATIONS ---------- */

  useEffect(() => {
    supabase
      .from("destinations")
      .select("id, name")
      .then(({ data }) => setDestinations(data || []));
  }, []);

  /* ---------- MAP ---------- */

  const destinationMap = useMemo(() => {
    const map: Record<string, string> = {};
    destinations.forEach((d) => {
      map[d.id] = d.name;
    });
    return map;
  }, [destinations]);

  /* ================= DESTINATION SUMMARY ================= */

  const destinationValue =
    data.destinations.length === 0
      ? "—"
      : data.destinations
          .map((region) => {
            const regionName = destinationMap[region.id] ?? region.id;

            if (!region.subRegions.length) return regionName;

            const subNames = region.subRegions
              .map((id) => destinationMap[id] ?? id)
              .join(", ");

            return `${regionName}: [${subNames}]`;
          })
          .join("\n");

  /* ================= GOLF SUMMARY ================= */

  const golfValue = !data.includesGolf
    ? "No golf planned"
    : [
        `Rounds planned: ${data.golfRounds ?? 1}`,
        data.mustHaveGolfCourses?.length
          ? `Must-have courses: ${data.mustHaveGolfCourses
              .map((id) => destinationMap[id] ?? id)
              .join(", ")}`
          : "Designer will include iconic courses",
      ].join("\n");

  /* ================= RENDER ================= */

  return (
    <StepWrapper
      title="Your journey summary"
      subtitle="Review your selections before we connect you with a travel designer"
    >
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border px-8 py-6 shadow-md">
        <Row
          icon={User}
          label="Traveller"
          value={data.travelerName || "—"}
          onEdit={() => goToStep("trip-basics", true)}
        />

        <Row
          icon={Users}
          label="Group size"
          value={`${data.groupSize} people`}
          onEdit={() => goToStep("group-size", true)}
        />

        <Row
          icon={Calendar}
          label="Travel timing"
          value={data.travelMonths.join(", ") || "Flexible"}
          onEdit={() => goToStep("travel-date", true)}
        />

        <Row
          icon={Route}
          label="Journey type"
          value={data.journeyType || "—"}
          onEdit={() => goToStep("journey-type", true)}
        />

        <Row
          icon={Clock}
          label="Duration"
          value={
            data.lengthOfStay === "custom"
              ? `${data.customLengthOfStay} nights`
              : data.lengthOfStay || "—"
          }
          onEdit={() => goToStep("length-of-stay", true)}
        />

        <Row
          icon={MapPin}
          label="Destinations"
          value={destinationValue}
          onEdit={() => goToStep("destinations", true)}
        />

        <Row
          icon={Flag} // ✅ SAFE ICON
          label="Golf"
          value={golfValue}
          onEdit={() => goToStep("golf-focus", true)}
        />

        <Row
          icon={Sparkles}
          label="Experiences"
          value={
            data.experiences.length
              ? data.experiences.map((e) => EXPERIENCE_LABELS[e]).join(", ")
              : "—"
          }
          onEdit={() => goToStep("experiences", true)}
        />

        <Row
          icon={Home}
          label="Accommodation"
          value={
            data.accommodationTypes.length
              ? data.accommodationTypes
                  .map((a) => ACCOMMODATION_LABELS[a])
                  .join(", ")
              : "—"
          }
          onEdit={() => goToStep("accommodation", true)}
        />

        <Row
          icon={Gauge}
          label="Pace"
          value={PACE_LABELS[data.pace] || "—"}
          onEdit={() => goToStep("pace", true)}
        />
      </div>
    </StepWrapper>
  );
}
