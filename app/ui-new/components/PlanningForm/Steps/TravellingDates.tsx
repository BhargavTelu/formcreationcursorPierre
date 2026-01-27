import { StepWrapper } from "../StepWrapper";
import { SelectionCard } from "../SelectionCard";
import { TripData } from "../../../types/TripPlanner";

interface TravellingDatesProps {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
  goToStep?: (id: string) => void;
}

const months = [
  "Jan 2026",
  "Feb 2026",
  "Mar 2026",
  "Apr 2026",
  "May 2026",
  "Jun 2026",
  "Jul 2026",
  "Aug 2026",
  "Sep 2026",
  "Oct 2026",
  "Nov 2026",
  "Dec 2026",
];

const TravellingDates = ({
  data,
  updateData,
}: TravellingDatesProps) => {
  const handleSelect = (month: string) => {
    updateData({ travelMonths: [month] });
  };

  const handleSkip = () => {
    updateData({ travelMonths: [] });
  };

  return (
    <StepWrapper
      title="When would you like to travel?"
      subtitle="Select a preferred month — or skip if you're flexible."
    >
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {months.map((month) => (
            <SelectionCard
              key={month}
              selected={data.travelMonths?.[0] === month}
              onClick={() => handleSelect(month)}
              size="sm"
              className="text-center"
            >
              <span className="font-medium">{month}</span>
            </SelectionCard>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="text-sm text-amber-700 hover:text-stone-700 transition"
        >
          Skip for now
        </button>
      </div>
    </StepWrapper>
  );
};

export default TravellingDates;
