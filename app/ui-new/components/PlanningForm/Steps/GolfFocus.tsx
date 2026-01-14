"use client";

import { useEffect, useRef } from "react";
import { StepWrapper } from "../StepWrapper";
import { TripData } from "../../../types/TripPlanner";
import { Switch } from "../../ui/switch";
import { Minus, Plus } from "lucide-react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";

import golfAnimation from "@/public/lottie/golf.json";

interface GolfFocusProps {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

export const GolfFocus = ({ data, updateData }: GolfFocusProps) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  const toggleGolf = (checked: boolean) => {
    updateData({
      includesGolf: checked,
      golfRounds: checked ? 1 : undefined, // ✅ FIX
    });
  };

  const increment = () => {
    if (!data.golfRounds) return;

    updateData({
      golfRounds: Math.min(data.golfRounds + 1, 10),
    });
  };

  const decrement = () => {
    if (!data.golfRounds) return;

    updateData({
      golfRounds: Math.max(data.golfRounds - 1, 1),
    });
  };

  useEffect(() => {
    if (!lottieRef.current) return;

    if (data.includesGolf) {
      lottieRef.current.stop();
      lottieRef.current.play();
    } else {
      lottieRef.current.stop();
    }
  }, [data.includesGolf]);

  return (
    <StepWrapper
      title="Will golf be part of this trip?"
      subtitle="A refined addition for travelers who enjoy the game"
    >
      <div className="max-w-sm mx-auto">
        {/* CARD */}
        <div
          className={`
            rounded-2xl border bg-card
            px-6 py-2
            transition-all duration-300
            ${
              data.includesGolf
                ? "border-amber-600 shadow-md"
                : "border-border"
            }
          `}
        >
          {/* LOTTIE */}
          <div className="flex justify-center mb-2">
            <div className="w-32 h-32">
              <Lottie
                lottieRef={lottieRef}
                animationData={golfAnimation}
                loop={false}
                autoplay={false}
              />
            </div>
          </div>

          {/* TOGGLE */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-base font-serif font-medium">
                Include Golf
              </p>
              <p className="text-xs text-muted-foreground">
                World-class courses in spectacular settings
              </p>
            </div>

            <Switch
              checked={data.includesGolf}
              onCheckedChange={toggleGolf}
            />
          </div>

          {/* ROUNDS */}
          <div
            className={`
              mt-3 pt-3 border-t
              flex items-center justify-center gap-5
              transition-all duration-300 ease-out
              ${
                data.includesGolf
                  ? "opacity-100 max-h-32"
                  : "opacity-0 max-h-0 overflow-hidden pointer-events-none"
              }
            `}
          >
            <button
              onClick={decrement}
              disabled={!data.golfRounds || data.golfRounds <= 1}
              className="
                h-9 w-9 rounded-full border
                flex items-center justify-center
                disabled:opacity-40
                hover:bg-muted
              "
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="text-center min-w-[70px]">
              <span className="text-2xl font-serif font-medium">
                {data.golfRounds}
              </span>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                rounds
              </p>
            </div>

            <button
              onClick={increment}
              disabled={!data.golfRounds || data.golfRounds >= 10}
              className="
                h-9 w-9 rounded-full border
                flex items-center justify-center
                disabled:opacity-40
                hover:bg-muted
              "
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </StepWrapper>
  );
};
