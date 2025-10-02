"use client";
import React, { useMemo, useState } from 'react';
import type { DestinationNode, Hotel } from '@/lib/data';

type SelectedDestination = { id: string; name: string; parent?: string | null };

type Props = {
  destinations: DestinationNode[];
  hotels: Hotel[];
  value: SelectedDestination[];
  onChange: (value: SelectedDestination[]) => void;
  selectedHotels: Hotel[];
  onHotelsChange: (hotels: Hotel[]) => void;
};

export default function DestinationSelector({
  destinations,
  hotels,
  value,
  onChange,
  selectedHotels,
  onHotelsChange,
}: Props) {
  const [query, setQuery] = useState('');

  const flatDestinations = useMemo(() => flattenDestinations(destinations), [destinations]);

  const matches = useMemo(() => {
    if (!query.trim()) return { destinations: [], hotels: [] as Hotel[] };
    const q = query.toLowerCase();
    return {
      destinations: flatDestinations.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 10),
      hotels: hotels.filter((h) => h.name.toLowerCase().includes(q)).slice(0, 10),
    };
  }, [query, flatDestinations, hotels]);

  const toggleDest = (dest: SelectedDestination) => {
    const set = new Map(value.map((v) => [v.id, v] as const));
    const wasSelected = set.has(dest.id);
    if (wasSelected) {
      set.delete(dest.id);
      // auto-remove hotels that belong to this dest id
      const filteredHotels = selectedHotels.filter(
        (h) => h.regionId !== dest.id && h.subRegionId !== dest.id
      );
      if (filteredHotels.length !== selectedHotels.length) onHotelsChange(filteredHotels);
      // remove child destinations recursively
      const children = childrenOf(dest.id, destinations);
      children.forEach((childId) => set.delete(childId));
    } else {
      set.set(dest.id, dest);
    }
    onChange(Array.from(set.values()));
  };

  const addHotel = (hotel: Hotel) => {
    if (selectedHotels.some((h) => h.id === hotel.id)) return;
    // ensure region/subregion are selected
    if (hotel.regionId && !value.some((v) => v.id === hotel.regionId)) {
      const regionNode = flatDestinations.find((d) => d.id === hotel.regionId);
      if (regionNode) toggleDest({ id: regionNode.id, name: regionNode.name, parent: null });
    }
    if (hotel.subRegionId && !value.some((v) => v.id === hotel.subRegionId)) {
      const subNode = flatDestinations.find((d) => d.id === hotel.subRegionId);
      if (subNode) toggleDest({ id: subNode.id, name: subNode.name, parent: subNode.parentIds.at(-1) ?? null });
    }
    onHotelsChange([...selectedHotels, hotel]);
  };

  const removeHotel = (hotelId: string) => {
    onHotelsChange(selectedHotels.filter((h) => h.id !== hotelId));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search destinations or hotels..."
          className="input"
        />
        {query && (matches.destinations.length > 0 || matches.hotels.length > 0) ? (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow">
            <div className="max-h-64 overflow-auto py-1 text-sm">
              {matches.destinations.map((d) => (
                <button
                  type="button"
                  key={`d-${d.id}`}
                  className="block w-full px-3 py-2 text-left hover:bg-gray-50"
                  onClick={() => {
                    toggleDest({ id: d.id, name: d.name, parent: d.parentIds.at(-1) ?? null });
                    setQuery('');
                  }}
                >
                  {d.name}
                  {d.pathString ? (
                    <span className="ml-2 text-gray-500 text-xs">{d.pathString}</span>
                  ) : null}
                </button>
              ))}
              {matches.hotels.map((h) => (
                <button
                  type="button"
                  key={`h-${h.id}`}
                  className="block w-full px-3 py-2 text-left hover:bg-gray-50"
                  onClick={() => {
                    addHotel(h);
                    setQuery('');
                  }}
                >
                  🏨 {h.name} <span className="ml-2 text-gray-500 text-xs">Hotel</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-700">Selected:</div>
        <div className="flex flex-wrap gap-2">
          {value.map((v) => (
            <span key={v.id} className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-1 text-xs font-medium text-white">
              {v.name}
              <button type="button" className="ml-1 text-white/80" onClick={() => toggleDest(v)}>
                ✕
              </button>
            </span>
          ))}
          {selectedHotels.map((h) => (
            <span key={h.id} className="inline-flex items-center rounded-full bg-sky-600 px-2 py-1 text-xs font-medium text-white">
              🏨 {h.name}
              <button type="button" className="ml-1 text-white/80" onClick={() => removeHotel(h.id)}>
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Basic tree (collapsed UI for brevity) */}
      <div className="border border-gray-200 rounded-md divide-y">
        {destinations.map((d) => (
          <TreeNode
            key={d.id}
            node={d}
            selected={new Set(value.map((v) => v.id))}
            onToggle={(node, parentId) => toggleDest({ id: node.id, name: node.name, parent: parentId ?? null })}
          />
        ))}
      </div>
    </div>
  );
}

function flattenDestinations(nodes: DestinationNode[]) {
  type Flat = { id: string; name: string; path: string[]; pathString: string; parentIds: string[] };
  const flat: Flat[] = [];
  const visit = (n: DestinationNode, path: string[] = [], parentIds: string[] = []) => {
    flat.push({ id: n.id, name: n.name, path, pathString: path.length ? path.join(' > ') : '', parentIds });
    if (n.subDestinations) {
      const newPath = [...path, n.name];
      const newParents = [...parentIds, n.id];
      n.subDestinations.forEach((c) => visit(c, newPath, newParents));
    }
  };
  nodes.forEach((n) => visit(n));
  return flat;
}

function childrenOf(id: string, nodes: DestinationNode[]): string[] {
  const out: string[] = [];
  const visit = (n: DestinationNode): boolean => {
    if (n.id === id) {
      collect(n);
      return true;
    }
    if (n.subDestinations) {
      for (const c of n.subDestinations) {
        if (visit(c)) return true;
      }
    }
    return false;
  };
  const collect = (n: DestinationNode) => {
    if (!n.subDestinations) return;
    for (const c of n.subDestinations) {
      out.push(c.id);
      collect(c);
    }
  };
  nodes.forEach((n) => visit(n));
  return out;
}

function TreeNode({
  node,
  selected,
  onToggle,
  parentId,
}: {
  node: DestinationNode;
  selected: Set<string>;
  onToggle: (node: DestinationNode, parentId?: string) => void;
  parentId?: string;
}) {
  const isChecked = selected.has(node.id);
  return (
    <div className="p-3">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          checked={isChecked}
          onChange={() => onToggle(node, parentId)}
        />
        <span className="font-medium text-gray-800">{node.name}</span>
      </label>
      {node.subDestinations && node.subDestinations.length > 0 ? (
        <div className="mt-2 ml-6 space-y-2">
          {node.subDestinations.map((c) => (
            <TreeNode key={c.id} node={c} selected={selected} onToggle={onToggle} parentId={node.id} />
          ))}
        </div>
      ) : null}
    </div>
  );
}


