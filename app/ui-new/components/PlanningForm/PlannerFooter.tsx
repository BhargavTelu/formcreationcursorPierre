"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { StepIndicator } from "./StepIndicator";

interface PlannerFooterProps {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export default function PlannerFooter({
  step,
  totalSteps,
  onBack,
  onNext,
  canProceed,
  isFirstStep,
  isLastStep,
}: PlannerFooterProps) {
  return (
    <div className="w-full h-14 bg-stone-50 border-t">
      <div className="h-full max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* BACK */}
        <button
          onClick={onBack}
          disabled={isFirstStep}
          className="
            flex items-center gap-2
            text-sm text-gray-500
            hover:text-gray-900
            disabled:opacity-40
          "
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* PROGRESS */}
        <StepIndicator
          totalSteps={totalSteps}
          currentStep={step - 1}
        />

        {/* NEXT */}
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="
            h-8 px-4 rounded-full
            flex items-center gap-2
            bg-amber-700 text-white text-sm
            hover:bg-amber-800
            active:scale-95
            disabled:opacity-50
          "
        >
          {isLastStep ? "Submit" : "Continue"}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
