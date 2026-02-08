// app/(wherever)/components/tripPlanner/steps/TripBasics/GolfFocusInline.tsx
"use client";

import { useEffect, useRef } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { TripData } from "../../../types/TripPlanner";
import { Switch } from "../../ui/switch";
import { Minus, Plus } from "lucide-react";
import golfAnimation from "@/public/lottie/golf.json";

interface Props {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

export const GolfFocusInline = ({ data, updateData }: Props) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  const enabled = data.includesGolf === true;
  const rounds = data.golfRounds ?? 1;

  const toggleGolf = (checked: boolean) => {
    updateData({
      includesGolf: checked,
      golfRounds: checked ? 1 : undefined,
      mustHaveGolfCourses: undefined, // ✅ removed fully
    });
  };

  const increment = () => {
    if (!enabled) return;
    updateData({ golfRounds: Math.min(rounds + 1, 10) });
  };

  const decrement = () => {
    if (!enabled) return;
    updateData({ golfRounds: Math.max(rounds - 1, 1) });
  };

  useEffect(() => {
    if (!lottieRef.current) return;

    if (enabled) {
      lottieRef.current.stop();
      lottieRef.current.play();
    } else {
      lottieRef.current.stop();
    }
  }, [enabled]);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Title */}
     

      {/* Card */}
      <div
        className={`
          rounded-2xl border bg-card px-6 py-5 transition-all duration-300
          ${enabled ? "border-amber-600 shadow-md" : "border-border"}
        `}
      >
        {/* Row with Lottie + Switch */}
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 -mt-1">
              <Lottie
                lottieRef={lottieRef}
                animationData={golfAnimation}
                loop={false}
                autoplay={false}
              />
            </div>

            <div>
              <p className="text-base font-serif font-medium">          Would you like to include golf?
</p>
              <p className="text-sm text-muted-foreground">
          Add golf to your journey and choose the number of rounds.
              </p>
            </div>
          </div>

          <Switch checked={enabled} onCheckedChange={toggleGolf} />
        </div>

        {/* Rounds (only when enabled) */}
        {enabled && (
          <div className="pt-5 mt-5 border-t flex items-center justify-around">
            <div>
              <p className="text-sm font-medium">How many rounds?</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={decrement}
                disabled={rounds <= 1}
                className="h-9 w-9 rounded-full border flex items-center justify-center disabled:opacity-40 hover:bg-muted"
                aria-label="Decrease rounds"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="text-center min-w-[70px]">
                <span className="text-2xl font-serif font-medium">{rounds}</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  rounds
                </p>
              </div>

              <button
                onClick={increment}
                disabled={rounds >= 10}
                className="h-9 w-9 rounded-full border flex items-center justify-center disabled:opacity-40 hover:bg-muted"
                aria-label="Increase rounds"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
