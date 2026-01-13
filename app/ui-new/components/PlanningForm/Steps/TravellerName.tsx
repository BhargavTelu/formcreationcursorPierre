import { StepWrapper } from "../StepWrapper";
import { Input } from "../../ui/input";
import { TripData } from "../../../types/TripPlanner";

interface Props {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

export default function TravellerName({ data, updateData }: Props) {
  return (
   <div>
     <StepWrapper
      title="Let’s get started"
      subtitle="Who is this journey for?"
    >
      <div className="max-w-md mx-auto">
        <Input
          placeholder="Enter your name"
          value={data.travelerName}
          onChange={(e) =>
            updateData({ travelerName: e.target.value })
          }
          className="text-center text-xl py-6 rounded-xl"
        />
      </div>
    </StepWrapper>
   </div>
  );
}
