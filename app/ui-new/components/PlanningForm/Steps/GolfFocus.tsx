"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { StepWrapper } from "../StepWrapper";
import { TripData } from "../../../types/TripPlanner";
import { Switch } from "../../ui/switch";
import { Minus, Plus, Check, PlusCircle } from "lucide-react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { supabase } from "@/lib/supabase";

import golfAnimation from "@/public/lottie/golf.json";

/* ================= TYPES ================= */

interface DBPlace {
  id: string;
  name: string;
  image_url: string | null;
}

/* ================= PROPS ================= */

interface GolfFocusProps {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

/* ================= COMPONENT ================= */

export const GolfFocus = ({ data, updateData }: GolfFocusProps) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [courses, setCourses] = useState<DBPlace[]>([]);

  const enabled = data.includesGolf === true;
  const selectedCourses = data.mustHaveGolfCourses ?? [];

  /* ================= FETCH COURSES ================= */

  useEffect(() => {
    supabase
      .from("destinations")
      .select("id, name, image_url")
      .eq("name", "Must Have Golf Courses")
      .single()
      .then(({ data }) => {
        if (!data) return;

        supabase
          .from("destinations")
          .select("id, name, image_url")
          .eq("parent_id", data.id)
          .then(({ data }) => setCourses(data || []));
      });
  }, []);

  /* ================= HANDLERS ================= */

  const toggleGolf = (checked: boolean) => {
    updateData({
      includesGolf: checked,
      golfRounds: checked ? 1 : undefined,
      mustHaveGolfCourses: checked ? [] : undefined,
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

  const toggleCourse = (id: string) => {
    const updated = selectedCourses.includes(id)
      ? selectedCourses.filter(c => c !== id)
      : [...selectedCourses, id];

    updateData({ mustHaveGolfCourses: updated });
  };

  /* ================= LOTTIE ================= */

  useEffect(() => {
    if (!lottieRef.current) return;

    if (enabled) {
      lottieRef.current.stop();
      lottieRef.current.play();
    } else {
      lottieRef.current.stop();
    }
  }, [enabled]);

  /* ================= UI ================= */

  return (
    <StepWrapper
      title="Enhance your journey"
      subtitle="Optional refinements curated by our travel designers"
    >
      <div className="max-w-xl mx-auto">
        <div
          className={`
            rounded-2xl border bg-card
            px-6 pb-5
            transition-all duration-300
            ${enabled ? "border-amber-600 shadow-md" : "border-border"}
          `}
        >
          {/* LOGO */}
          <div className="flex justify-center -mt-4 mb-4">
            <div className="w-24 h-20">
              <Lottie
                lottieRef={lottieRef}
                animationData={golfAnimation}
                loop={false}
                autoplay={false}
              />
            </div>
          </div>

          {/* QUESTION */}
          <div className="flex items-center justify-evenly mb-4">
            <div>
              <p className="text-base font-serif font-medium">
                Must-have golf courses?
              </p>
            </div>

            <Switch
              checked={enabled}
              onCheckedChange={toggleGolf}
            />
          </div>

          {/* ================= EXPANDED CONTENT ================= */}
          <div
            className={`
              transition-all duration-300 ease-out
              ${
                enabled
                  ? "opacity-100 max-h-[1000px]"
                  : "opacity-0 max-h-0 overflow-hidden pointer-events-none"
              }
            `}
          >
            {/* ROUNDS */}
            <div className="pt-4 border-t flex items-center justify-center gap-6">
              <button
                onClick={decrement}
                disabled={!data.golfRounds || data.golfRounds <= 1}
                className="h-9 w-9 rounded-full border flex items-center justify-center disabled:opacity-40 hover:bg-muted"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="text-center min-w-[80px]">
                <span className="text-2xl font-serif font-medium">
                  {data.golfRounds}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  rounds
                </p>
              </div>

              <button
                onClick={increment}
                disabled={!data.golfRounds || data.golfRounds >= 10}
                className="h-9 w-9 rounded-full border flex items-center justify-center disabled:opacity-40 hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* COURSES */}
            {courses.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-serif mb-3">
                  Must-Have Golf Courses
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {courses.map(course => {
                    const checked = selectedCourses.includes(course.id);

                    return (
                      <button
                        key={course.id}
                        onClick={() => toggleCourse(course.id)}
                        className={`
                          relative h-32 rounded-xl overflow-hidden border transition
                          ${
                            checked
                              ? "border-amber-700 ring-2 ring-amber-600/60"
                              : "border-gray-300 hover:border-gray-400"
                          }
                        `}
                      >
                        {course.image_url && (
                          <Image
                            src={course.image_url}
                            alt={course.name}
                            fill
                            className="object-cover"
                          />
                        )}

                        <div className="absolute inset-0 bg-black/35" />

                        <div className="absolute top-2 right-2 bg-white/95 rounded-full p-1.5 shadow">
                          {checked ? (
                            <Check className="w-4 h-4 text-amber-700" />
                          ) : (
                            <PlusCircle className="w-4 h-4 text-gray-700" />
                          )}
                        </div>

                        <div className="absolute bottom-0 inset-x-0 p-3">
                          <p className="text-white text-xs font-medium">
                            {course.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StepWrapper>
  );
};
