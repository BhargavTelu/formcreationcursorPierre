"use client";

import { StepWrapper } from "../StepWrapper";
import TripBasics from "./TripBasics";
import TravellingDates from "./TravellingDates";
import { LengthOfStay } from "./LengthOfStay";
import { JourneyType } from "./JourneyType";
import { TripData } from "../../../types/TripPlanner";
import { GolfFocusInline } from "./GolfFocusInline";

interface Props {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

export default function TripBasicsCombined({ data, updateData }: Props) {
  return (
    <StepWrapper
      title="Let’s get started"
      subtitle="Tell us the essentials so we can design your journey"
    >
      <div className="space-y-24">
        <TripBasics data={data} updateData={updateData} />

        <TravellingDates
          data={data}
          updateData={updateData}
          goToStep={() => {}}
        />

        <LengthOfStay data={data} updateData={updateData} />

        <JourneyType data={data} updateData={updateData} />
          <GolfFocusInline data={data} updateData={updateData} />
      </div>
    </StepWrapper>
  );
}
