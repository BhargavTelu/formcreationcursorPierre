"use client";

import { useEffect, useState } from "react";
import Header from "../MainPageSections/Header";
import PlannerFooter from "./PlannerFooter";
import { TripData } from "../../types/TripPlanner";

/* Steps */
import TripBasics from "./Steps/TripBasics";
import TravellingDates from "./Steps/TravellingDates";
import { LengthOfStay } from "./Steps/LengthOfStay";
import { JourneyType } from "./Steps/JourneyType";
import { GolfFocus } from "./Steps/GolfFocus";
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

/* ---------------- STEPS ---------------- */

const steps: StepConfig[] = [
  {
    id: "trip-basics",
    component: TripBasics,
    isValid: (d) => d.travelerName.trim().length > 0 && d.groupSize >= 1,
  },
  {
    id: "travel-date",
    component: TravellingDates,
    isValid: () => true,
  },
  {
    id: "length-of-stay",
    component: LengthOfStay,
    isValid: (d) => !!d.lengthOfStay,
  },
  {
    id: "journey-type",
    component: JourneyType,
    isValid: (d) => !!d.journeyType,
  },
  {
    id: "golf-focus",
    component: GolfFocus,
    isValid: () => true,
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

export default function TripPlanner({ onExit }: { onExit: () => void }) {
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

    if (fromReview) {
      setReturnStep("review");
    }

    setStepIndex(index);
  };

  const currentStep = steps[stepIndex];
  const StepComponent = currentStep.component;
  const canProceed = currentStep.isValid(tripData);

  /* ---------- NEXT HANDLER (🔥 KEY FIX) ---------- */

  const handleNext = () => {
    const stepId = steps[stepIndex].id;

    // ✅ RETURN TO REVIEW AFTER EDIT
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

  /* ---------- SUBMIT ---------- */

  const submitTrip = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await fetch("/api/trip-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
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
