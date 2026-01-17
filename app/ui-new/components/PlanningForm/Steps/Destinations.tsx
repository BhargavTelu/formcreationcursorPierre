"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { StepWrapper } from "../StepWrapper";
import { TripData } from "../../../types/TripPlanner";
import { supabase } from "@/lib/supabase";
import { Plus, Check, ArrowLeft } from "lucide-react";

/* ================= TYPES ================= */

interface DBPlace {
  id: string;
  name: string;
  image_url: string | null;
  parent_id: string | null;
}

interface Props {
  data: TripData;
  updateData: (data: Partial<TripData>) => void;
}

/* ================= COMPONENT ================= */

export const Destinations = ({ data, updateData }: Props) => {
  const [places, setPlaces] = useState<DBPlace[]>([]);
  const [activeRegion, setActiveRegion] = useState<DBPlace | null>(null);
  const [activeArea, setActiveArea] = useState<DBPlace | null>(null);

  const selected = data.destinations ?? [];

  /* ================= FETCH ================= */

  useEffect(() => {
    supabase
      .from("destinations")
      .select("id, name, image_url, parent_id")
      .order("name")
      .then(({ data }) => setPlaces(data || []));
  }, []);

  /* ================= DERIVED ================= */

  const regions = useMemo(
    () => places.filter(p => p.parent_id === null).slice(0, 8),
    [places]
  );

  const childrenMap = useMemo(() => {
    const map: Record<string, DBPlace[]> = {};
    places.forEach(p => {
      if (!p.parent_id) return;
      if (!map[p.parent_id]) map[p.parent_id] = [];
      map[p.parent_id].push(p);
    });
    return map;
  }, [places]);

  /* ================= DATA HELPERS ================= */

  const regionEntry = (regionId: string) =>
    selected.find(d => d.id === regionId);

  const isSelected = (regionId: string, childId?: string) => {
    const entry = regionEntry(regionId);
    if (!entry) return false;
    if (!childId) return true;
    return entry.subRegions.includes(childId);
  };

  const upsertRegion = (regionId: string, subRegions: string[]) => {
    const exists = regionEntry(regionId);

    updateData({
      destinations: exists
        ? selected.map(d =>
            d.id === regionId ? { ...d, subRegions } : d
          )
        : [...selected, { id: regionId, subRegions }],
    });
  };

  /* ================= CLICK HANDLERS ================= */

  const openRegion = (region: DBPlace) => {
    if (!regionEntry(region.id)) {
      upsertRegion(region.id, []);
    }
    setActiveRegion(region);
    setActiveArea(null);
  };

  const handleAreaClick = (area: DBPlace) => {
    if (!activeRegion) return;

    const entry = regionEntry(activeRegion.id);
    const subs = entry?.subRegions ?? [];
    const hasHotels = (childrenMap[area.id] || []).length > 0;

    const updatedSubs = subs.includes(area.id)
      ? subs.filter(id => id !== area.id)
      : [...subs, area.id];

    upsertRegion(activeRegion.id, updatedSubs);

  
    if (hasHotels) {
      setActiveArea(area);
    }
  };

  const toggleHotel = (hotel: DBPlace) => {
    if (!activeRegion) return;

    const entry = regionEntry(activeRegion.id);
    const subs = entry?.subRegions ?? [];

    const updated = subs.includes(hotel.id)
      ? subs.filter(id => id !== hotel.id)
      : [...subs, hotel.id];

    upsertRegion(activeRegion.id, updated);
  };

  /* ================= BACK HANDLER ================= */

  const handleBack = () => {
    if (activeArea) {
      setActiveArea(null);        // Hotel → Area
    } else if (activeRegion) {
      setActiveRegion(null);      // Area → Region
    }
  };

  /* ================= UI HELPERS ================= */

  const Badge = ({ checked }: { checked: boolean }) => (
    <div className="absolute top-4 right-4 z-10 rounded-full bg-white/95 p-1.5 shadow-md">
      {checked ? (
        <Check className="w-4 h-4 text-amber-700" />
      ) : (
        <Plus className="w-4 h-4 text-gray-700" />
      )}
    </div>
  );

  const cardClass = (checked: boolean) => `
    relative overflow-hidden transition-all
    ${
      checked
        ? "border-amber-900 ring-4 ring-amber-700/70"
        : "border border-gray-300 hover:border-gray-400"
    }
  `;

  /* ================= BREADCRUMB ================= */

  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-sm text-stone-600 mb-6">
      <button onClick={handleBack} className="flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" />
        {activeArea ? activeRegion?.name  : "Regions"}
      </button>
    </div>
  );

  /* ================= HOTELS ================= */

  if (activeRegion && activeArea) {
    const hotels = childrenMap[activeArea.id] || [];

    return (
      <StepWrapper title={`Stay in ${activeArea.name}`} subtitle="Select one or more hotels">
        <Breadcrumb />

        <div className="grid grid-cols-4 gap-8">
          {hotels.map(hotel => {
            const checked = isSelected(activeRegion.id, hotel.id);

            return (
              <button
                key={hotel.id}
                onClick={() => toggleHotel(hotel)}
                className={`${cardClass(checked)} h-60 rounded-2xl`}
              >
                {hotel.image_url && (
                  <Image src={hotel.image_url} alt={hotel.name} fill className="object-cover" />
                )}
                <div className="absolute inset-0 bg-black/35" />
                <Badge checked={checked} />
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <h3 className="text-white font-serif text-m">{hotel.name}</h3>
                </div>
              </button>
            );
          })}
        </div>
      </StepWrapper>
    );
  }

  /* ================= AREAS ================= */

  if (activeRegion) {
    const areas = childrenMap[activeRegion.id] || [];

    return (
      <StepWrapper title={`Explore ${activeRegion.name}`} subtitle="Choose areas">
        <Breadcrumb />

        <div className="grid grid-cols-4 gap-10">
          {areas.map(area => {
            const checked = isSelected(activeRegion.id, area.id);

            return (
              <button
                key={area.id}
                onClick={() => handleAreaClick(area)}
                className={`${cardClass(checked)} h-60 rounded-2xl`}
              >
                {area.image_url && (
                  <Image src={area.image_url} alt={area.name} fill className="object-cover" />
                )}
                <div className="absolute inset-0 bg-black/30" />
                <Badge checked={checked} />
                <div className="absolute top-0 inset-x-0 p-7">
                  <h3 className="text-white font-serif text-l">{area.name}</h3>
                </div>
              </button>
            );
          })}
        </div>
      </StepWrapper>
    );
  }

  /* ================= REGIONS ================= */

  return (
    <StepWrapper title="Where would you like to go?" subtitle="Choose regions to explore">
      <div className="grid grid-cols-3 gap-12">
        {regions.map(region => {
          const checked = isSelected(region.id);

          return (
            <button
              key={region.id}
              onClick={() => openRegion(region)}
              className={`${cardClass(checked)} h-[250px] rounded-[1.5rem]`}
            >
              {region.image_url && (
                <Image src={region.image_url} alt={region.name} fill className="object-cover" />
              )}
              <div className="absolute inset-0 bg-black/30" />
              <Badge checked={checked} />
              <div className="absolute top-0 inset-x-0 p-6">
                <h2 className="text-white font-serif text-l">{region.name}</h2>
              </div>
            </button>
          );
        })}
      </div>
    </StepWrapper>
  );
};
