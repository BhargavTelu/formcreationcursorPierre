"use client";

import { StepWrapper } from "../StepWrapper";
import { TripData } from "../../../types/TripPlanner";
import { EXPERIENCE_LABELS, ACCOMMODATION_LABELS, PACE_LABELS } from "../../../types/labels";
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
  Flag,
  Pencil,
} from "lucide-react";

/* ================= TYPES ================= */

interface ReviewStepProps {
  data: TripData;
  goToStep: (id: string, fromReview?: boolean) => void;
}

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
  /* ================= DESTINATION SUMMARY ================= */

  const destinationValue =
    data.destinations.length === 0
      ? "—"
      : data.destinations
          .map((region) => {
            const regionName = region.name || region.id;

            if (!region.subRegions.length) return regionName;

            const subNames = region.subRegions
              .map((sub) => sub.name || sub.id)
              .join(", ");

            return `${regionName}: ${subNames}`;
          })
          .join("\n");

  /* ================= GOLF SUMMARY ================= */

  const golfValue = !data.includesGolf
    ? "No golf planned"
    : [
        `Rounds planned: ${data.golfRounds ?? 1}`,
        data.mustHaveGolfCourses?.length
          ? `Must-have courses: ${data.mustHaveGolfCourses.join(", ")}`
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
          onEdit={() => goToStep("trip-basics-combined", true)}
        />

        <Row
          icon={Users}
          label="Group size"
          value={`${data.groupSize} people`}
          onEdit={() => goToStep("trip-basics-combined", true)}
        />

        <Row
          icon={Calendar}
          label="Travel timing"
          value={data.travelMonths.join(", ") || "Flexible"}
          onEdit={() => goToStep("trip-basics-combined", true)}
        />

        <Row
          icon={Route}
          label="Journey type"
          value={data.journeyType || "—"}
          onEdit={() => goToStep("trip-basics-combined", true)}
        />

        <Row
          icon={Clock}
          label="Duration"
          value={
            data.lengthOfStay === "custom"
              ? `${data.customLengthOfStay} nights`
              : data.lengthOfStay || "—"
          }
          onEdit={() => goToStep("trip-basics-combined", true)}
        />

        <Row
          icon={MapPin}
          label="Destinations"
          value={destinationValue}
          onEdit={() => goToStep("destinations", true)}
        />

        <Row
          icon={Flag}
          label="Golf"
          value={golfValue}
          onEdit={() => goToStep("trip-basics-combined", true)}
        />

        <Row
          icon={Sparkles}
          label="Experiences"
          value={
            data.experiences.length
              ? data.experiences.map((e) => EXPERIENCE_LABELS[e] ?? e).join(", ")
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
                  .map((a) => ACCOMMODATION_LABELS[a] ?? a)
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
