import { StepWrapper } from "../StepWrapper";
import { SelectionCard } from "../SelectionCard";
import { TripData } from "../../../types/TripPlanner";

interface TravellingDatesProps {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

const months = [
  { short: "Jan 2026", full: "January" },
  { short: "Feb 2026", full: "February" },
  { short: "Mar 2026", full: "March" },
  { short: "Apr 2026", full: "April" },
  { short: "May 2026", full: "May" },
  { short: "Jun 2026", full: "June" },
  { short: "Jul 2026", full: "July" },
  { short: "Aug 2026", full: "August" },
  { short: "Sep 2026", full: "September" },
  { short: "Oct 2026", full: "October" },
  { short: "Nov 2026", full: "November" },
  { short: "Dec 2026", full: "December" },
];

const TravellingDates = ({
  data,
  updateData,
}: TravellingDatesProps) => {
  const toggleMonth = (month: string) => {
    const currentMonths = data.travelMonths;

    if (currentMonths.includes(month)) {
      updateData({
        travelMonths: currentMonths.filter((m) => m !== month),
      });
    } else {
      updateData({
        travelMonths: [...currentMonths, month],
      });
    }
  };

  return (
    <StepWrapper
      title="When would you like to travel?"
      subtitle="Select one or more months that work for you"
    >
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {months.map((month) => (
            <SelectionCard
              key={month.short}
              selected={data.travelMonths.includes(month.short)}
              onClick={() => toggleMonth(month.short)}
              size="sm"
              className="text-center"
            >
              <span className="font-medium">{month.short}</span>
            </SelectionCard>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-6 text-sm">
          Don&apos;t worry — you can refine the exact dates later with your
          travel designer.
        </p>
      </div>
    </StepWrapper>
  );
};

export default TravellingDates;
