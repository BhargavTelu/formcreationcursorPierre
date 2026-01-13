import { cn } from "../../types/utils";

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export const StepIndicator = ({
  totalSteps,
  currentStep,
}: StepIndicatorProps) => {
  return (
    <div className="flex gap-2 items-center">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <div
            key={i}
            className={cn(
              `
              h-2 rounded-full transition-all duration-500 ease-out
              `,
              isCurrent && "w-10 bg-amber-700 animate-breathe",
              isCompleted && "w-2 bg-amber-700",
              !isCompleted && !isCurrent && "w-2 bg-gray-400"
            )}
          />
        );
      })}

      <style jsx>{`
        .animate-breathe {
          animation: breathe 1.8s ease-in-out infinite;
        }
        @keyframes breathe {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};
