import { cn } from "../../types/utils";
import { ReactNode } from "react";

interface SelectionCardProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const SelectionCard = ({
  selected,
  onClick,
  children,
  className,
  size = "md",
}: SelectionCardProps) => {
  const sizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        `
        relative w-full text-left
        rounded-2xl border-2
        transition-all duration-300
        active:scale-[0.98]
        focus:outline-none
        `,
        selected
          ? "border-amber-600 shadow-lg bg-amber-50/40"
          : "border-border hover:border-amber-600/50 hover:shadow-md",
        sizeClasses[size],
        className
      )}
    >
      {/* Selection pulse */}
      {selected && (
        <span className="absolute inset-0 rounded-2xl ring-2 ring-amber-600/30 animate-pulse-soft pointer-events-none" />
      )}

      {children}

      <style jsx>{`
        .animate-pulse-soft {
          animation: pulseSoft 1.4s ease-out;
        }
        @keyframes pulseSoft {
          from {
            opacity: 0.6;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
};
