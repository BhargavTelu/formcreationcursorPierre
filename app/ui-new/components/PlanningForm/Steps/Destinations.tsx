"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { StepWrapper } from "../StepWrapper";
import { TripData } from "../../../types/TripPlanner";
import { supabase } from "@/lib/supabase";

interface DBRegion {
  id: string;
  name: string;
  image_url: string | null;
  parent_id: string | null;
}

interface Props {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

export const Destinations = ({ data, updateData }: Props) => {
  const [regions, setRegions] = useState<DBRegion[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const selected = data.destinations ?? [];

  /* ================= FETCH ================= */

  useEffect(() => {
    supabase
      .from("destinations")
      .select("id, name, image_url, parent_id")
      .order("name")
      .then(({ data }) => setRegions(data || []));
  }, []);

  /* ================= DERIVED ================= */

  const mainRegions = useMemo(
    () =>
      regions.filter(r => r.parent_id === null).slice(0, 8),
    [regions]
  );

  const subByParent = useMemo(() => {
    const map: Record<string, DBRegion[]> = {};
    regions
      .filter(r => r.parent_id !== null)
      .forEach(r => {
        if (!map[r.parent_id!]) map[r.parent_id!] = [];
        map[r.parent_id!].push(r);
      });
    return map;
  }, [regions]);

  const activeRegion = regions.find(r => r.id === activeId);

  /* ================= HELPERS ================= */

  const selectedSubsFor = (id: string) =>
    selected.find(d => d.id === id)?.subRegions ?? [];

  const selectedSubCount = (id: string) =>
    selectedSubsFor(id).length;

  const toggleActive = (id: string) => {
    setActiveId(prev => (prev === id ? null : id));
  };

  const toggleSub = (mainId: string, subId: string) => {
    const existing = selected.find(d => d.id === mainId);

    if (!existing) {
      updateData({
        destinations: [
          ...selected,
          { id: mainId, subRegions: [subId] },
        ],
      });
      return;
    }

    const updatedSubs = existing.subRegions.includes(subId)
      ? existing.subRegions.filter(s => s !== subId)
      : [...existing.subRegions, subId];

    updateData({
      destinations:
        updatedSubs.length === 0
          ? selected.filter(d => d.id !== mainId)
          : selected.map(d =>
              d.id === mainId
                ? { ...d, subRegions: updatedSubs }
                : d
            ),
    });
  };

  /* ================= SPLIT VIEW ================= */

  if (activeRegion) {
    const subs = subByParent[activeRegion.id] || [];

    return (
      <StepWrapper
        title="Refine your destination"
        subtitle="Select specific places within this region"
      >
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT — MAIN REGION */}
          <div className="col-span-4">
            <button
              onClick={() => toggleActive(activeRegion.id)}
              className="relative h-64 w-full rounded-2xl overflow-hidden border-2 border-amber-600"
            >
              {activeRegion.image_url ? (
                <Image
                  src={activeRegion.image_url}
                  alt={activeRegion.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full bg-gray-200 flex items-center justify-center">
                  📍
                </div>
              )}

              <div className="absolute bottom-0 inset-x-0 bg-black/50 p-4">
                <h2 className="text-white font-serif text-lg">
                  {activeRegion.name}
                </h2>
                <p className="text-white/80 text-xs mt-1">
                  Click again to return
                </p>
              </div>
            </button>
          </div>

          {/* RIGHT — SUB REGIONS */}
          <div className="col-span-8">
            <div className="grid grid-cols-3 gap-4">
              {subs.map(sub => {
                const checked =
                  selectedSubsFor(activeRegion.id).includes(sub.id);

                return (
                  <button
                    key={sub.id}
                    onClick={() =>
                      toggleSub(activeRegion.id, sub.id)
                    }
                    className={`relative h-40 rounded-xl overflow-hidden border transition
                      ${
                        checked
                          ? "border-amber-600 ring-2 ring-amber-200"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                  >
                    {sub.image_url ? (
                      <Image
                        src={sub.image_url}
                        alt={sub.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full bg-gray-200 flex items-center justify-center">
                        📍
                      </div>
                    )}

                    {checked && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center">
                        ✓
                      </div>
                    )}

                    <div className="absolute bottom-0 inset-x-0 bg-black/40 p-2">
                      <h3 className="text-white text-xs font-medium">
                        {sub.name}
                      </h3>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </StepWrapper>
    );
  }

  /* ================= MAIN GRID ================= */

  return (
    <StepWrapper
      title="Where would you like to go?"
      subtitle="Choose a region to explore places within it"
    >
      <div className="grid grid-cols-4 gap-4">
        {mainRegions.map(region => {
          const count = selectedSubCount(region.id);

          return (
            <button
              key={region.id}
              onClick={() => toggleActive(region.id)}
              className={`relative h-32 rounded-xl overflow-hidden border transition
                ${
                  count > 0
                    ? "border-amber-600 ring-2 ring-amber-200"
                    : "border-gray-300 hover:border-gray-400"
                }`}
            >
              {region.image_url ? (
                <Image
                  src={region.image_url}
                  alt={region.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full bg-gray-200 flex items-center justify-center">
                  📍
                </div>
              )}

              {/* SELECTED SUB COUNT */}
              {count > 0 && (
                <div className="absolute top-2 right-2 rounded-full bg-amber-600 text-white text-xs px-2 py-0.5">
                  {count}
                </div>
              )}

              <div className="absolute bottom-0 inset-x-0 bg-black/40 p-2">
                <h3 className="text-white text-xs font-medium">
                  {region.name}
                </h3>
              </div>
            </button>
          );
        })}
      </div>
    </StepWrapper>
  );
};
