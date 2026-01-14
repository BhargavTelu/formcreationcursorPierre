"use client";

import { StepWrapper } from "../StepWrapper";
import { SelectionCard } from "../SelectionCard";
import { TripData } from "../../../types/TripPlanner";
import Lottie from "lottie-react";

import golfAnimation from "../../../../../public/lottie/golf.json";

interface Props {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

export const GolfFocus = ({ data, updateData }: Props) => {
  return (
    <StepWrapper
      title="Will golf be part of this trip?"
      subtitle="A refined addition for travelers who enjoy the game"
    >
      <div className="max-w-xl mx-auto grid grid-cols-2 gap-4">
        {/* YES */}
        <SelectionCard
          selected={data.includesGolf === true}
          onClick={() => updateData({ includesGolf: true })}
        >
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-2">
              <Lottie
                animationData={golfAnimation}
                loop
                autoplay
              />
            </div>
            <h3 className="font-serif text-lg">Yes</h3>
            <p className="text-sm text-muted-foreground">
              Include golf experiences
            </p>
          </div>
        </SelectionCard>

        {/* NO */}
        <SelectionCard
          selected={data.includesGolf === false}
          onClick={() =>
            updateData({ includesGolf: false, golfRounds: undefined })
          }
        >
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-2 opacity-40">
              <Lottie
                animationData={golfAnimation}
                loop={false}
                autoplay={false}
              />
            </div>
            <h3 className="font-serif text-lg">No</h3>
            <p className="text-sm text-muted-foreground">
              No golf on this trip
            </p>
          </div>
        </SelectionCard>
      </div>
    </StepWrapper>
  );
};
