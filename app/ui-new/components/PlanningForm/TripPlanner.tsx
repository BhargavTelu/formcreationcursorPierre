"use client";

import { useEffect, useState } from "react";
import Header from "../MainPageSections/Header";
import PlannerFooter from "./PlannerFooter";
import { TripData } from "../../types/TripPlanner";

/* ---------------- STEPS ---------------- */

import TripBasicsCombined from "./Steps/TripBasicsCombined";
import { Destinations } from "./Steps/Destinations";
import Experiences from "./Steps/Experiences";
import Accommodation from "./Steps/Accommodation";
import Pace from "./Steps/Pace";
import Review from "./Steps/Review";
import ThankYou from "./Steps/ThankYou";

/* ---------------- TYPES ---------------- */

type StepConfig = {
  id: string;
  component: React.ComponentType<any>;
  isValid: (data: TripData) => boolean;
};

/* ---------------- STEPS CONFIG ---------------- */

const steps: StepConfig[] = [
  {
    id: "trip-basics-combined",
    component: TripBasicsCombined,
    isValid: (d) =>
      d.travelerName.trim().length > 0 &&
      d.groupSize >= 1 &&
      !!d.lengthOfStay &&
      !!d.journeyType,
  },
  {
    id: "destinations",
    component: Destinations,
    isValid: (d) => d.destinations.length > 0,
  },
  {
    id: "experiences",
    component: Experiences,
    isValid: (d) => d.experiences.length > 0,
  },
  {
    id: "accommodation",
    component: Accommodation,
    isValid: () => true,
  },
  {
    id: "pace",
    component: Pace,
    isValid: (d) => !!d.pace,
  },
  {
    id: "review",
    component: Review,
    isValid: () => true,
  },
  {
    id: "thank-you",
    component: ThankYou,
    isValid: () => true,
  },
];

const TOTAL_STEPS = steps.length;

/* ---------------- COMPONENT ---------------- */

interface Agency {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

interface TripPlannerProps {
  onExit: () => void;
  agency?: Agency;
}

export default function TripPlanner({ onExit, agency }: TripPlannerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [returnStep, setReturnStep] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [tripData, setTripData] = useState<TripData>({
    travelerName: "",
    groupSize: 2,
    travelMonths: [],
    specificDate: "",
    journeyType: "",
    journeyPath: "",
    lengthOfStay: "",
    customLengthOfStay: undefined,
    includesGolf: false,
    golfRounds: undefined,
    destinations: [],
    experiences: [],
    accommodationFeel: "",
    accommodationTypes: [],
    pace: "",
    generalNotes: "",
  });

  const updateData = (data: Partial<TripData>) =>
    setTripData((prev) => ({ ...prev, ...data }));

  /* ---------- GO TO STEP ---------- */

  const goToStep = (id: string, fromReview = false) => {
    const index = steps.findIndex((s) => s.id === id);
    if (index === -1) return;

    if (fromReview) setReturnStep("review");
    setStepIndex(index);
  };

  const currentStep = steps[stepIndex];
  const StepComponent = currentStep.component;
  const canProceed = currentStep.isValid(tripData);

  /* ---------- NEXT HANDLER ---------- */

  const handleNext = () => {
    const stepId = currentStep.id;

    if (returnStep === "review" && stepId !== "review") {
      setReturnStep(null);
      goToStep("review");
      return;
    }

    if (stepId === "review") {
      submitTrip();
      return;
    }

    setStepIndex((i) => Math.min(TOTAL_STEPS - 1, i + 1));
  };

  /* ---------- LABEL MAPPINGS ---------- */

  const EXPERIENCE_LABELS: Record<string, string> = {
    beach: "Beach & Coast",
    nature: "Nature & Scenic",
    safari: "Safari & Wildlife",
    city: "City & Culture",
    adventure: "Adventure & Outdoors",
    history: "History & Local Life",
  };

  const ACCOMMODATION_LABELS: Record<string, string> = {
    boutique: "Boutique hotels",
    lodges: "Lodges & safari camps",
    guesthouse: "Guesthouses / B&Bs",
    hotel: "Hotels with bar & pool",
  };

  const PACE_LABELS: Record<string, string> = {
    relaxed: "Unhurried",
    balanced: "Balanced",
    active: "Full days",
  };

  /* ---------- SUBMIT ---------- */

  const submitTrip = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // Transform data: Map IDs to full labels and clean up empty fields
      const submissionData: any = {
        // Basic info
        travelerName: tripData.travelerName,
        groupSize: tripData.groupSize,

        // Travel timing
        travelMonths: tripData.travelMonths,
        ...(tripData.specificDate && { specificDate: tripData.specificDate }),

        // Journey type
        journeyType: tripData.journeyType,
        ...(tripData.journeyPath && { journeyPath: tripData.journeyPath }),

        // Length of stay
        lengthOfStay: tripData.lengthOfStay,
        ...(tripData.customLengthOfStay && { customLengthOfStay: tripData.customLengthOfStay }),

        // Golf
        includesGolf: tripData.includesGolf,
        ...(tripData.golfRounds && { golfRounds: tripData.golfRounds }),
        ...(tripData.mustHaveGolfCourses?.length && { mustHaveGolfCourses: tripData.mustHaveGolfCourses }),

        // Destinations (already has names)
        destinations: tripData.destinations,

        // ✅ TRANSFORM: Map IDs to full labels
        experiences: tripData.experiences.map((id) => EXPERIENCE_LABELS[id] || id),
        accommodationTypes: tripData.accommodationTypes.map((id) => ACCOMMODATION_LABELS[id] || id),
        pace: tripData.pace ? PACE_LABELS[tripData.pace] || tripData.pace : "",

        // Optional fields - only include if not empty
        ...(tripData.accommodationFeel && { accommodationFeel: tripData.accommodationFeel }),
        ...(tripData.generalNotes && { generalNotes: tripData.generalNotes }),

        // Timestamp
        timestamp: new Date().toISOString(),

        // Include agency context if present
        ...(agency && {
          agency: {
            id: agency.id,
            name: agency.name,
            subdomain: agency.subdomain,
          },
        }),
      };

      console.log("🚀 Submitting trip data:", submissionData);

      await fetch("/api/trip-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      goToStep("thank-you");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- ENTER KEY ---------- */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (!canProceed) return;
      handleNext();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [stepIndex, canProceed, returnStep]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <header className="h-20 shrink-0">
        <Header variant="planner" onExit={onExit} />
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <StepComponent
            data={tripData}
            updateData={updateData}
            goToStep={goToStep}
            onExit={onExit}
          />
        </div>
      </main>

      {steps[stepIndex].id !== "thank-you" && (
        <footer className="h-14 shrink-0">
          <PlannerFooter
            step={stepIndex + 1}
            totalSteps={TOTAL_STEPS - 1}
            canProceed={canProceed && !submitting}
            isFirstStep={stepIndex === 0}
            isLastStep={steps[stepIndex].id === "review"}
            onBack={() => setStepIndex((i) => Math.max(0, i - 1))}
            onNext={handleNext}
          />
        </footer>
      )}
    </div>
  );
}
