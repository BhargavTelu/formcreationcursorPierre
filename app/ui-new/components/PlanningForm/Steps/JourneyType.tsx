import { StepWrapper } from "../StepWrapper";
import { SelectionCard } from "../SelectionCard";
import { TripData } from "../../../types/TripPlanner";
import { Map, Compass } from "lucide-react";

interface JourneyTypeProps {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

export const JourneyType = ({ data, updateData }: JourneyTypeProps) => {
  return (
    <StepWrapper
      title="How would you like your journey crafted?"
      subtitle="Choose your preferred planning approach"
    >
      <div className="max-w-xl mx-auto grid md:grid-cols-2 gap-4">
        {/* Pre-defined (disabled) */}
        <div className="pointer-events-none opacity-50">
          <SelectionCard selected={false} size="md">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-safari-light flex items-center justify-center">
                <Map className="w-7 h-7 text-safari" />
              </div>
              <h3 className="text-lg font-serif font-medium mb-1">
                Pre-defined Routes
              </h3>
              <p className="text-muted-foreground text-sm">
                Expertly curated itineraries (coming soon).
              </p>
            </div>
          </SelectionCard>
        </div>

        {/* Custom (active) */}
        <SelectionCard
          selected={data.journeyType === "custom"}
          onClick={() => updateData({ journeyType: "custom" })}
          size="md"
          className="cursor-pointer"
        >
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-gold/10 flex items-center justify-center">
              <Compass className="w-7 h-7 text-gold" />
            </div>
            <h3 className="text-lg font-serif font-medium mb-1">
              Custom Trip Design
            </h3>
            <p className="text-muted-foreground text-sm">
              Craft a completely bespoke journey with our specialists.
            </p>
          </div>
        </SelectionCard>
      </div>
    </StepWrapper>
  );
};
