import { StepWrapper } from "../StepWrapper";
import { SelectionCard } from "../SelectionCard";
import { TripData } from "../../../types/TripPlanner";
import { Minus, Plus } from "lucide-react";

interface GroupSizeProps {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

const presetSizes = [1, 2, 3, 4, 5, 6];

export const GroupSize = ({ data, updateData }: GroupSizeProps) => {
  const handleIncrement = () => {
    updateData({ groupSize: Math.min(data.groupSize + 1, 20) });
  };

  const handleDecrement = () => {
    updateData({ groupSize: Math.max(data.groupSize - 1, 1) });
  };

  return (
    <StepWrapper
      title="How many travelers?"
      subtitle="Tell us the size of your group"
    >
      <div className="max-w-xl mx-auto">
        {/* Preset buttons */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {presetSizes.map((size) => (
            <SelectionCard
              key={size}
              selected={data.groupSize === size}
              onClick={() => updateData({ groupSize: size })}
              size="sm"
              className="flex items-center justify-center"
            >
              <span className="text-2xl font-serif font-medium">
                {size}
              </span>
            </SelectionCard>
          ))}
        </div>

        {/* Custom stepper */}
        <div className="flex items-center justify-center gap-6 p-3 bg-card rounded-2xl border border-border">
          {/* MINUS */}
          <button
            type="button"
            onClick={handleDecrement}
            disabled={data.groupSize <= 1}
            className="
              h-12 w-12 rounded-full border-2
              flex items-center justify-center
              text-gray-900
              disabled:opacity-40
              hover:bg-gray-100
              transition
            "
          >
            <Minus className="h-5 w-5" />
          </button>

          {/* VALUE */}
          <div className="text-center min-w-[100px]">
            <span className="text-4xl font-serif font-medium">
              {data.groupSize}
            </span>
            <p className="text-muted-foreground text-sm mt-1">
              {data.groupSize === 1 ? "traveler" : "travelers"}
            </p>
          </div>

          {/* PLUS */}
          <button
            type="button"
            onClick={handleIncrement}
            disabled={data.groupSize >= 20}
            className="
              h-12 w-12 rounded-full border-2
              flex items-center justify-center
              text-gray-900
              disabled:opacity-40
              hover:bg-gray-100
              transition
            "
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </StepWrapper>
  );
};
