import { StepWrapper } from "../StepWrapper";
import { SelectionCard } from "../SelectionCard";
import { TripData } from "../../../types/TripPlanner";

interface TravellingDatesProps {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
  goToStep?: (id: string) => void;
}

/** Generate the next 12 calendar months starting from today */
function getUpcomingMonths(): string[] {
  const SHORT_MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const now = new Date();
  const result: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    result.push(`${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`);
  }
  return result;
}

const months = getUpcomingMonths();

const TravellingDates = ({ data, updateData }: TravellingDatesProps) => {
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
