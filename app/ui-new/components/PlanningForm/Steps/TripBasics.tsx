"use client";

import { StepWrapper } from "../StepWrapper";
import { Input } from "../../ui/input";
import { TripData } from "../../../types/TripPlanner";
import { Minus, Plus } from "lucide-react";

interface Props {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

export default function TripBasics({ data, updateData }: Props) {
  const increment = () => {
    updateData({ groupSize: Math.min(data.groupSize + 1, 20) });
  };

  const decrement = () => {
    updateData({ groupSize: Math.max(data.groupSize - 1, 1) });
  };

  return (
    <StepWrapper
      title=""
      subtitle=""
    >
      <div className="max-w-lg mx-auto space-y-14">

        {/* TRAVELLER NAME */}
        <div className="flex flex-col items-center space-y-3">
          <label className="text-sm text-muted-foreground">
            Traveller name
          </label>

          <Input
            placeholder="Your name"
            value={data.travelerName}
            onChange={(e) =>
              updateData({ travelerName: e.target.value })
            }
            className="
              w-[360px]
              text-lg
              py-4
              px-5
              rounded-xl
              border border-stone-200
              text-center
              focus:border-amber-600
              focus:ring-0
              transition
            "
          />
        </div>

        {/* GROUP SIZE */}
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm text-muted-foreground">
            How many travellers?
          </p>

          <div className="flex items-center gap-8">
            {/* MINUS */}
            <button
              type="button"
              onClick={decrement}
              disabled={data.groupSize <= 1}
              className="
                h-12 w-12
                rounded-full
                border border-stone-300
                flex items-center justify-center
                text-stone-700
                disabled:opacity-30
                hover:bg-stone-50
                transition
              "
            >
              <Minus className="h-5 w-5" />
            </button>

            {/* VALUE */}
            <div className="text-center min-w-[90px]">
              <span className="block text-4xl font-serif">
                {data.groupSize}
              </span>
              <span className="text-xs text-muted-foreground">
                {data.groupSize === 1 ? "traveller" : "travellers"}
              </span>
            </div>

            {/* PLUS */}
            <button
              type="button"
              onClick={increment}
              disabled={data.groupSize >= 20}
              className="
                h-12 w-12
                rounded-full
                border border-stone-300
                flex items-center justify-center
                text-stone-700
                disabled:opacity-30
                hover:bg-stone-50
                transition
              "
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </StepWrapper>
  );
}
