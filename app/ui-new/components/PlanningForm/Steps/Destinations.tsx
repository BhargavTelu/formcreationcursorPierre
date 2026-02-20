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
  isHotel?: boolean;
}

interface DBHotel {
  id: string;
  name: string;
  image_url: string | null;
  destination_id: string;
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
    const fetchData = async () => {
      // Fetch destinations
      const { data: destData } = await supabase
        .from("destinations")
        .select("id, name, image_url, parent_id")
        .order("name");

      // Fetch hotels from the separate hotels table
      const { data: hotelData } = await supabase
        .from("hotels")
        .select("id, name, image_url, destination_id")
        .order("name");

      const destinations: DBPlace[] = (destData || []).map((d) => ({
        ...d,
        isHotel: false,
      }));

      // Convert hotels into DBPlace entries so they appear as children
      // of their parent destination via destination_id
      const hotelPlaces: DBPlace[] = (hotelData || []).map((h: DBHotel) => ({
        id: h.id,
        name: h.name,
        image_url: h.image_url,
        parent_id: h.destination_id,
        isHotel: true,
      }));

      setPlaces([...destinations, ...hotelPlaces]);
    };

    fetchData();
  }, []);

  /* ================= DERIVED ================= */

  const regions = useMemo(
    () => places.filter((p) => p.parent_id === null),
    [places]
  );

  const childrenMap = useMemo(() => {
    const map: Record<string, DBPlace[]> = {};
    places.forEach((p) => {
      if (!p.parent_id) return;
      if (!map[p.parent_id]) map[p.parent_id] = [];
      map[p.parent_id].push(p);
    });
    return map;
  }, [places]);

  const areas = useMemo(() => {
    if (!activeRegion) return [];
    return childrenMap[activeRegion.id] || [];
  }, [activeRegion, childrenMap]);

  const hotels = useMemo(() => {
    if (!activeArea) return [];
    return childrenMap[activeArea.id] || [];
  }, [activeArea, childrenMap]);

  /* ================= DATA HELPERS ================= */

  const regionEntry = (regionId: string) =>
    selected.find((d) => d.id === regionId);

  // ✅ Region is "selected" ONLY if it has at least 1 chosen area/hotel
  const isRegionSelected = (regionId: string) => {
    const entry = regionEntry(regionId);
    return !!entry && entry.subRegions.length > 0;
  };

  const isSelected = (regionId: string, childId?: string) => {
    const entry = regionEntry(regionId);
    if (!entry) return false;

    if (!childId) {
      // ✅ region selection depends on having children
      return entry.subRegions.length > 0;
    }

    return entry.subRegions.some((sub) => sub.id === childId);
  };

  // ✅ If subRegions becomes empty, remove the region from TripData
  const upsertRegion = (regionId: string, regionName: string, subRegions: Array<{ id: string; name: string }>) => {
    const exists = regionEntry(regionId);

    // remove region entry if nothing selected
    if (subRegions.length === 0) {
      updateData({
        destinations: exists ? selected.filter((d) => d.id !== regionId) : selected,
      });
      return;
    }

    updateData({
      destinations: exists
        ? selected.map((d) => (d.id === regionId ? { id: regionId, name: regionName, subRegions } : d))
        : [...selected, { id: regionId, name: regionName, subRegions }],
    });
  };

  const ensureRegionExists = (regionId: string, regionName: string) => {
    if (!regionEntry(regionId)) {
      // create region entry but DO NOT make it "selected" unless we add children
      updateData({
        destinations: [...selected, { id: regionId, name: regionName, subRegions: [] }],
      });
    }
  };

  /* ================= CLICK HANDLERS ================= */

  const openRegion = (region: DBPlace) => {
    // ✅ Do NOT auto-select the region here
    setActiveRegion(region);
    setActiveArea(null);
  };

  const handleAreaClick = (area: DBPlace) => {
    if (!activeRegion) return;

    ensureRegionExists(activeRegion.id, activeRegion.name);

    const entry = regionEntry(activeRegion.id);
    const subs = entry?.subRegions ?? [];

    const isCurrentlySelected = subs.some((sub) => sub.id === area.id);
    const updatedSubs = isCurrentlySelected
      ? subs.filter((sub) => sub.id !== area.id)
      : [...subs, { id: area.id, name: area.name }];

    upsertRegion(activeRegion.id, activeRegion.name, updatedSubs);

    // ✅ If unselecting the active area, hide hotels
    if (isCurrentlySelected && activeArea?.id === area.id) {
      setActiveArea(null);
      return;
    }

    // ✅ If selecting, show hotels for this area
    if (!isCurrentlySelected) {
      setActiveArea(area);
      return;
    }
  };

  const toggleHotel = (hotel: DBPlace) => {
    if (!activeRegion) return;

    ensureRegionExists(activeRegion.id, activeRegion.name);

    const entry = regionEntry(activeRegion.id);
    const subs = entry?.subRegions ?? [];

    const updated = subs.some((sub) => sub.id === hotel.id)
      ? subs.filter((sub) => sub.id !== hotel.id)
      : [...subs, { id: hotel.id, name: hotel.name }];

    upsertRegion(activeRegion.id, activeRegion.name, updated);
  };

  /* ================= BACK HANDLER ================= */

  const backOne = () => {
    if (activeArea) setActiveArea(null);
    else if (activeRegion) setActiveRegion(null);
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
      {(activeRegion || activeArea) && (
        <button onClick={backOne} className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          {activeArea ? "Areas" : "Regions"}
        </button>
      )}

      <span className="opacity-50">/</span>
      <span>{activeRegion?.name ?? "Regions"}</span>

      {activeArea && (
        <>
          <span className="opacity-50">/</span>
          <span>{activeArea.name}</span>
        </>
      )}
    </div>
  );

  /* ================= REGIONS ONLY (initial) ================= */

  if (!activeRegion) {
    return (
      <StepWrapper title="Where would you like to go?" subtitle="Choose regions to explore">
        <div className="grid grid-cols-3 gap-12">
          {regions.map((region) => {
            // ✅ Now only true if any area/hotel selected inside
            const checked = isRegionSelected(region.id);

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
  }

  /* ================= 3-COLUMN VIEW (Regions widest, Areas medium, Hotels smallest) ================= */

  return (
    <StepWrapper
      title="Where would you like to go?"
      subtitle="Choose regions, areas, and hotels — all in one view"
    >
      <Breadcrumb />

      <div className="grid grid-cols-12 gap-10">
        {/* LEFT: Regions (WIDEST) */}
        <div className="col-span-5 space-y-4">
          <h4 className="text-sm font-medium text-stone-700">Regions</h4>

          <div className="grid grid-cols-1 gap-4">
            {regions.map((region) => {
              // highlight active region, and ALSO show selection ring if it has chosen children
              const checked = region.id === activeRegion.id || isRegionSelected(region.id);

              return (
                <button
                  key={region.id}
                  onClick={() => openRegion(region)}
                  className={`${cardClass(checked)} h-48 rounded-2xl`}
                >
                  {region.image_url && (
                    <Image src={region.image_url} alt={region.name} fill className="object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-0 p-5 flex items-end">
                    <h3 className="text-white font-serif text-base">{region.name}</h3>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* MIDDLE: Areas (MEDIUM) */}
        <div className="col-span-4 space-y-4">
          <h4 className="text-sm font-medium text-stone-700">
            Explore {activeRegion.name} &amp; Surroundings
          </h4>

          {areas.length === 0 ? (
            <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
              No areas found for this region.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {areas.map((area) => {
                const checked = isSelected(activeRegion.id, area.id);
                const isActive = activeArea?.id === area.id;

                return (
                  <button
                    key={area.id}
                    onClick={() => handleAreaClick(area)}
                    className={`
                      ${cardClass(checked)} h-44 rounded-2xl
                      ${isActive ? "ring-4 ring-amber-600/40" : ""}
                    `}
                  >
                    {area.image_url && (
                      <Image src={area.image_url} alt={area.name} fill className="object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/30" />
                    <Badge checked={checked} />
                    <div className="absolute top-0 inset-x-0 p-6">
                      <h3 className="text-white font-serif text-l">{area.name}</h3>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Hotels (SMALLEST) */}
        <div className="col-span-3 space-y-4">
          <h4 className="text-sm font-medium text-stone-700">
            {activeArea ? `Stay in ${activeArea.name}` : "Select an area to see hotels"}
          </h4>

          {!activeArea ? (
            <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
              Choose an area to load hotels here.
            </div>
          ) : hotels.length === 0 ? (
            <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
              No hotels found under {activeArea.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {hotels.map((hotel) => {
                const checked = isSelected(activeRegion.id, hotel.id);

                return (
                  <button
                    key={hotel.id}
                    onClick={() => toggleHotel(hotel)}
                    className={`${cardClass(checked)} h-32 rounded-2xl`}
                  >
                    {hotel.image_url && (
                      <Image src={hotel.image_url} alt={hotel.name} fill className="object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/35" />
                    <Badge checked={checked} />
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <h3 className="text-white font-serif text-m">{hotel.name}</h3>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StepWrapper>
  );
};
