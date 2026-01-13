import { StepWrapper } from "../StepWrapper";
import { SelectionCard } from "../SelectionCard";
import { TripData } from "../../../types/TripPlanner";
import { Minus, Plus } from "lucide-react";

interface LengthOfStayProps {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

const durations = [
  { value: "7", label: "1 Week", nights: "7 nights" },
  { value: "10", label: "10 Nights", nights: "Extended escape" },
  { value: "14", label: "2 Weeks", nights: "14 nights" },
  { value: "21", label: "3 Weeks", nights: "Grand adventure" },
  { value: "custom", label: "Custom", nights: "You decide" },
];

export const LengthOfStay = ({ data, updateData }: LengthOfStayProps) => {
  const isCustom = data.lengthOfStay === "custom";

  const increment = () => {
    updateData({
      customLengthOfStay: Math.min(
        (data.customLengthOfStay || 3) + 1,
        30
      ),
    });
  };

  const decrement = () => {
    updateData({
      customLengthOfStay: Math.max(
        (data.customLengthOfStay || 3) - 1,
        3
      ),
    });
  };

  return (
    <StepWrapper
      title="How long would you like to stay?"
      subtitle="Select the ideal duration for your journey"
    >
      <div className="max-w-3xl mx-auto">
        {/* PRESET OPTIONS */}
        {!isCustom && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {durations.map((duration) => (
              <SelectionCard
                key={duration.value}
                selected={data.lengthOfStay === duration.value}
                onClick={() =>
                  updateData({
                    lengthOfStay: duration.value,
                    customLengthOfStay: duration.value === "custom" ? 3 : undefined,
                  })
                }
                size="md"
                className="text-center"
              >
                <h3 className="text-lg font-serif font-medium mb-1">
                  {duration.label}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {duration.nights}
                </p>
              </SelectionCard>
            ))}
          </div>
        )}

        {/* CUSTOM SELECTOR */}
        {isCustom && (
          <div className="max-w-md mx-auto mt-8">
            <div className="flex items-center justify-center gap-6 p-6 border rounded-2xl bg-card">
              <button
                type="button"
                onClick={decrement}
                className="h-12 w-12 rounded-full border flex items-center justify-center hover:bg-muted"
              >
                <Minus className="h-5 w-5" />
              </button>

              <div className="text-center min-w-[120px]">
                <span className="text-4xl font-serif font-medium">
                  {data.customLengthOfStay || 3}
                </span>
                <p className="text-muted-foreground text-sm mt-1">
                  nights
                </p>
              </div>

              <button
                type="button"
                onClick={increment}
                className="h-12 w-12 rounded-full border flex items-center justify-center hover:bg-muted"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Back option */}
            <button
              type="button"
              onClick={() =>
                updateData({
                  lengthOfStay: "",
                  customLengthOfStay: undefined,
                })
              }
              className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to preset options
            </button>
          </div>
        )}
      </div>
    </StepWrapper>
  );
};
