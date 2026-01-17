import { StepWrapper } from "../StepWrapper";
import { SelectionCard } from "../SelectionCard";
import { TripData } from "../../../types/TripPlanner";
import { Hotel, Home, Trees, Star } from "lucide-react";

interface Props {
  data: TripData;
  goToStep: any;
  updateData: (data: Partial<TripData>) => void;
}

const ACCOMMODATION_TYPES = [
  {
    id: "boutique",
    label: "Boutique hotels",
    icon: Hotel,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "lodges",
    label: "Lodges & safari camps",
    icon: Trees,
    image:
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "guesthouse",
    label: "Guesthouses / B&Bs",
    icon: Home,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
  },
  {
  id: "hotel",
  label: "Hotels with bar & pool",
  icon: Star,
  image:
    "https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=900&q=80",
},

];

export default function Accommodation({ data, goToStep, updateData }: Props) {
  const selected = data.accommodationTypes;

  const toggle = (id: string) => {
    updateData({
      accommodationTypes: selected.includes(id)
        ? selected.filter(v => v !== id)
        : [...selected, id],
    });
  };
const NEXT_STEP_ID = "pace";

 const handleSkip = () => {
    updateData({
      travelMonths: [],
    });
    goToStep(NEXT_STEP_ID);
  };
  return (
    <StepWrapper
      title="Any accommodation styles you especially enjoy?"
      subtitle="This helps us fine-tune your stay"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {ACCOMMODATION_TYPES.map(
          ({ id, label, icon: Icon, image }) => {
            const isSelected = selected.includes(id);

            return (
              <SelectionCard
                key={id}
                selected={isSelected}
                onClick={() => toggle(id)}
                className="overflow-hidden"
              >
                <div className="relative h-40 rounded-xl overflow-hidden">
                  {/* IMAGE */}
                  <img
                    src={image}
                    alt={label}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  {/* OVERLAY */}
                  <div className="absolute inset-0 bg-black/30" />

                  {/* ICON BADGE */}
                  <div
                    className={`
                      absolute top-3 left-3
                      w-10 h-10 rounded-full
                      flex items-center justify-center
                      backdrop-blur
                      ${
                        isSelected
                          ? "bg-amber-700/90"
                          : "bg-white/80"
                      }
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isSelected
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    />
                  </div>

                  {/* LABEL */}
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <h3 className="text-white text-sm font-medium">
                      {label}
                    </h3>
                  </div>
                </div>
              </SelectionCard>
            );
          }
        )}
      </div>
       <button
            type="button"
            onClick={handleSkip}
            className="text-sm mt-5  text-amber-700 hover:text-stone-700 transition"
          >
            Skip for now
          </button>
    </StepWrapper>
  );
}
