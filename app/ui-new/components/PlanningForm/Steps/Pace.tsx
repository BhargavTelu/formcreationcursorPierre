import { StepWrapper } from "../StepWrapper";
import { SelectionCard } from "../SelectionCard";
import type { TripData } from "../../../types/TripPlanner";
import type { ElementType } from "react";
import { Coffee, Gauge, Activity } from "lucide-react";

interface Props {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

/**
 * Derive the pace union directly from TripData
 */
type PaceType = TripData["pace"];

/**
 * Single pace option type (exclude empty string)
 */
type PaceOption = {
  id: Exclude<PaceType, "">;
  title: string;
  subtitle: string;
  icon: ElementType;
};

const PACE_OPTIONS: PaceOption[] = [
  {
    id: "relaxed",
    title: "Unhurried",
    subtitle: "More time in fewer places",
    icon: Coffee,
  },
  {
    id: "balanced",
    title: "Balanced",
    subtitle: "A mix of exploring and downtime",
    icon: Gauge,
  },
  {
    id: "active",
    title: "Full days",
    subtitle: "See & do as much as possible",
    icon: Activity,
  },
];

export default function Pace({ data, updateData }: Props) {
  return (
    <StepWrapper
      title="How full would you like your days to feel?"
      subtitle="This helps us set the rhythm of your journey"
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {PACE_OPTIONS.map(({ id, title, subtitle, icon: Icon }) => {
            const selected = data.pace === id;

            return (
              <SelectionCard
                key={id}
                selected={selected}
                onClick={() => updateData({ pace: id })}
                className="py-10"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  {/* ICON */}
                  <div
                    className={`w-10 h-12 rounded-xl flex items-center justify-center ${
                      selected ? "bg-amber-700/10" : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        selected
                          ? "text-amber-700"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  {/* TEXT */}
                  <div>
                    <h3 className="font-serif font-medium text-sm">
                      {title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {subtitle}
                    </p>
                  </div>
                </div>
              </SelectionCard>
            );
          })}
        </div>
      </div>
    </StepWrapper>
  );
}
