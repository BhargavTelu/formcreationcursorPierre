import { StepWrapper } from "../StepWrapper";
import { ImageCard } from "../ImageCard";
import { TripData } from "../../../types/TripPlanner";

interface ExperiencesProps {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
  goToStep: (id: string) => void;
}

/* ================= DATA ================= */

const EXPERIENCES = [
  {
    id: "beach",
    title: "Beach & Coast",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "nature",
    title: "Nature & Scenic",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "safari",
    title: "Safari & Wildlife",
    image:
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "city",
    title: "City & Culture",
    image:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "adventure",
    title: "Adventure & Outdoors",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "history",
    title: "History & Local Life",
    image:
      "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=900&q=80",
  },
];

const NEXT_STEP_ID = "accommodation";

/* ================= COMPONENT ================= */

export default function Experiences({
  data,
  updateData,
  goToStep,
}: ExperiencesProps) {
  const selected = data.experiences;

  /* ---------- TOGGLE ---------- */

  const toggle = (id: string) => {
    updateData({
      experiences: selected.includes(id)
        ? selected.filter((v) => v !== id)
        : [...selected, id],
    });
  };

  /* ---------- SKIP ---------- */
  /**
   * Skip MUST NOT:
   * - clear experiences
   * - overwrite selections
   * - introduce defaults
   *
   * It only moves forward.
   */
  const handleSkip = () => {
    updateData({
      experiences: []
    });
    goToStep(NEXT_STEP_ID);
  };

  /* ---------- RENDER ---------- */

  return (
    <StepWrapper
      title="What would you love to include?"
      subtitle="Select all experiences that appeal to you"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {EXPERIENCES.map((exp) => (
          <ImageCard
            key={exp.id}
            image={exp.image}
            title={exp.title}
            selected={selected.includes(exp.id)}
            size="small"
            onClick={() => toggle(exp.id)}
          />
        ))}
      </div>

      {/* SKIP */}
      <div className="mt-6 text-center">
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
}
