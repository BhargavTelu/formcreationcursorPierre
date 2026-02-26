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
  { value: "custom", label: "Customize", nights: "You decide" },
];

export const LengthOfStay = ({ data, updateData }: LengthOfStayProps) => {
  const isCustom = data.lengthOfStay === "custom";

  const increment = () => {
    updateData({
      customLengthOfStay: Math.min((data.customLengthOfStay || 3) + 1, 30),
    });
  };

  const decrement = () => {
    updateData({
      customLengthOfStay: Math.max((data.customLengthOfStay || 3) - 1, 3),
    });
  };

  return (
    <StepWrapper
      title="How long would you like to stay?"
      subtitle="Select the ideal duration for your journey"
    >
      <div className="max-w-3xl mx-auto space-y-6">
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
              <p className="text-muted-foreground text-xs">{duration.nights}</p>
            </SelectionCard>
          ))}
        </div>

        {/* Custom nights picker — only shown when "Customize" is selected */}
        {isCustom && (
          <div className="flex items-center justify-center gap-6 pt-2">
            <button
              type="button"
              onClick={decrement}
              disabled={(data.customLengthOfStay || 3) <= 3}
              className="h-10 w-10 rounded-full border flex items-center justify-center disabled:opacity-40 hover:bg-muted transition"
              aria-label="Decrease nights"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="text-center min-w-[90px]">
              <span className="block text-4xl font-serif">
                {data.customLengthOfStay || 3}
              </span>
              <span className="text-xs text-muted-foreground">nights</span>
            </div>

            <button
              type="button"
              onClick={increment}
              disabled={(data.customLengthOfStay || 3) >= 30}
              className="h-10 w-10 rounded-full border flex items-center justify-center disabled:opacity-40 hover:bg-muted transition"
              aria-label="Increase nights"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </StepWrapper>
  );
};
