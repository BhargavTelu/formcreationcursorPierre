"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { supabase, type Destination, type Hotel } from '@/lib/supabase';

export interface DestinationTreeItem {
  id: string;
  name: string;
  image_url: string;
  parent_id: string | null;
  children: DestinationTreeItem[];
  isHotel?: boolean;
}

export type SelectedItem = {
  id: string;
  name: string;
  image_url: string;
  isHotel?: boolean;
};

interface DestinationTreeProps {
  value: SelectedItem[];
  onChange: (items: SelectedItem[]) => void;
}

export default function DestinationTree({ value, onChange }: DestinationTreeProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Active selection path from root → ... → current
  const [activePath, setActivePath] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch destinations
        const { data: destinationsData, error: destinationsError } = await supabase
          .from('destinations')
          .select('*')
          .order('name');

        if (destinationsError) {
          console.error('Destinations fetch error:', destinationsError);
          throw new Error(`Failed to fetch destinations: ${destinationsError.message}`);
        }

        // Fetch hotels
        const { data: hotelsData, error: hotelsError } = await supabase
          .from('hotels')
          .select('*')
          .order('name');

        if (hotelsError) {
          console.error('Hotels fetch error:', hotelsError);
          throw new Error(`Failed to fetch hotels: ${hotelsError.message}`);
        }

        setDestinations(destinationsData || []);
        setHotels(hotelsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Build tree structure
  const treeData = useMemo(() => {
    if (!destinations.length) return [];

    // Create a map for quick lookup
    const destinationMap = new Map<string, DestinationTreeItem>();
    
    // Initialize all destinations
    destinations.forEach(dest => {
      destinationMap.set(dest.id, {
        id: dest.id,
        name: dest.name,
        image_url: dest.image_url,
        parent_id: dest.parent_id,
        children: [],
        isHotel: false
      });
    });

    // Add hotels as children of their subregions
    hotels.forEach(hotel => {
      const hotelItem: DestinationTreeItem = {
        id: hotel.id,
        name: hotel.name,
        image_url: hotel.image_url,
        parent_id: hotel.subregion_id,
        children: [],
        isHotel: true
      };

      const parent = destinationMap.get(hotel.subregion_id);
      if (parent) {
        parent.children.push(hotelItem);
      }
    });

    // Build parent-child relationships for destinations
    destinations.forEach(dest => {
      if (dest.parent_id) {
        const parent = destinationMap.get(dest.parent_id);
        const child = destinationMap.get(dest.id);
        if (parent && child) {
          parent.children.push(child);
        }
      }
    });

    // Return root nodes (destinations with parent_id = null)
    return destinations
      .filter(dest => dest.parent_id === null)
      .map(dest => destinationMap.get(dest.id)!)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [destinations, hotels]);

  // Index nodes for quick lookup
  const nodeIndex: Record<string, DestinationTreeItem> = useMemo(() => {
    const idx: Record<string, DestinationTreeItem> = {};
    const visit = (n: DestinationTreeItem) => {
      idx[n.id] = n;
      n.children.forEach(visit);
    };
    treeData.forEach(visit);
    return idx;
  }, [treeData]);

  // Build a parent map for quick ancestor lookup
  const parentMap: Record<string, string | null> = useMemo(() => {
    const map: Record<string, string | null> = {};
    const visit = (n: DestinationTreeItem) => {
      map[n.id] = n.parent_id;
      n.children.forEach(visit);
    };
    treeData.forEach((n) => {
      map[n.id] = n.parent_id; // roots have null
      n.children.forEach(visit);
    });
    return map;
  }, [treeData]);

  const getChildren = (nodeId: string | null) => {
    if (nodeId === null) return treeData;
    const n = nodeIndex[nodeId];
    return n ? n.children : [];
  };

  // Build horizontal columns based on activePath
  const columns: DestinationTreeItem[][] = useMemo(() => {
    const cols: DestinationTreeItem[][] = [];
    cols.push(getChildren(null)); // main regions
    for (let i = 0; i < activePath.length; i++) {
      cols.push(getChildren(activePath[i]));
    }
    return cols;
  }, [activePath, nodeIndex, treeData]);

  const onClickNode = (node: DestinationTreeItem, depth: number) => {
    // Update active path at this depth
    const newPath = [...activePath.slice(0, depth), node.id];
    setActivePath(newPath);
    // Selecting the node (no dropdowns)
    if (!value.some(v => v.id === node.id)) {
      onChange([...value, { id: node.id, name: node.name, image_url: node.image_url, isHotel: node.isHotel }]);
    }
  };

  const removeSelected = (id: string) => {
    onChange(value.filter(v => v.id !== id));
  };

  // Flatten items for search: include both destinations and hotels with paths
  type FlatItem = { id: string; name: string; isHotel?: boolean; parent_id: string | null; pathIds: string[]; pathNames: string[] };
  const flatItems: FlatItem[] = useMemo(() => {
    const items: FlatItem[] = [];
    const buildPath = (startId: string): { pathIds: string[]; pathNames: string[] } => {
      const ids: string[] = [];
      const names: string[] = [];
      let cur: string | null = startId;
      // Walk up to root
      while (cur) {
        const node = nodeIndex[cur];
        if (!node) break;
        ids.push(node.id);
        names.push(node.name);
        cur = parentMap[cur] ?? null;
      }
      ids.reverse();
      names.reverse();
      return { pathIds: ids, pathNames: names };
    };
    // Destinations
    Object.values(nodeIndex).forEach((node) => {
      if (!node.isHotel) {
        const p = buildPath(node.id);
        items.push({ id: node.id, name: node.name, isHotel: false, parent_id: node.parent_id, pathIds: p.pathIds, pathNames: p.pathNames });
      }
    });
    // Hotels
    Object.values(nodeIndex).forEach((node) => {
      if (node.isHotel) {
        const p = buildPath(node.id);
        items.push({ id: node.id, name: node.name, isHotel: true, parent_id: node.parent_id, pathIds: p.pathIds, pathNames: p.pathNames });
      }
    });
    // Deduplicate just in case
    const seen = new Set<string>();
    return items.filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
  }, [nodeIndex, parentMap]);

  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as FlatItem[];
    return flatItems
      .filter((it) => it.name.toLowerCase().includes(q) || it.pathNames.join(' ').toLowerCase().includes(q))
      .slice(0, 20);
  }, [query, flatItems]);

  const onSelectFromSearch = (it: FlatItem) => {
    // Select target and all ancestors; open columns to target
    const pathIds = it.pathIds; // root → ... → target
    setActivePath(pathIds);
    const toAdd: SelectedItem[] = [];
    pathIds.forEach((id) => {
      const node = nodeIndex[id];
      if (!node) return;
      if (!value.some((v) => v.id === id)) {
        toAdd.push({ id, name: node.name, image_url: node.image_url, isHotel: node.isHotel });
      }
    });
    const newValue = [...value, ...toAdd];
    onChange(newValue);
    setQuery('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          <span className="text-gray-600">Loading destinations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-red-800">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          className="input"
          placeholder="Search destinations or hotels..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && searchMatches.length > 0 ? (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow">
            <div className="max-h-72 overflow-auto py-1 text-sm">
              {searchMatches.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-gray-50"
                  onClick={() => onSelectFromSearch(m)}
                >
                  {m.isHotel ? '🏨' : '📍'} {m.name}
                  {m.pathNames.length > 0 ? (
                    <span className="ml-2 text-gray-500 text-xs">{m.pathNames.join(' > ')}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {value.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-700">Selected:</div>
          <div className="flex flex-wrap gap-2">
            {value.map((item) => (
              <span key={item.id} className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-sm font-medium text-white">
                {item.isHotel ? '🏨' : '📍'} {item.name}
                <button type="button" className="ml-2 text-white/80 hover:text-white" onClick={() => removeSelected(item.id)}>✕</button>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Horizontal columns: main regions → sub-regions → deeper levels */}
      <div className="flex gap-4 overflow-x-auto">
        {columns.map((items, depth) => (
          <div key={depth} className="min-w-[260px] w-64 shrink-0">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              {depth === 0 ? 'Main Regions' : depth === 1 ? 'Sub-Regions' : 'More'}
            </div>
            <div className="space-y-3">
              {items.map((node) => {
                const selected = activePath[depth] === node.id;
                return (
                  <button
                    type="button"
                    key={node.id}
                    onClick={() => onClickNode(node, depth)}
                    className={`w-full text-left rounded-lg border p-3 transition-all duration-200 ${selected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 overflow-hidden rounded-md bg-gray-100">
                        {typeof node.image_url === 'string' && node.image_url.trim() ? (
                          <Image
                            src={node.image_url}
                            alt={node.name}
                            fill
                            sizes="(max-width: 640px) 56px, 56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl">{node.isHotel ? '🏨' : '📍'}</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{node.name}</div>
                        {node.isHotel ? (<div className="text-xs text-blue-700">Hotel</div>) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
              {items.length === 0 ? (<div className="text-sm text-gray-500">No items</div>) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

