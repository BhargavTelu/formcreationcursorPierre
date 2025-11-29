"use client";
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
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
  // Track highlighted search results in tree
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  // Track if search dropdown is open
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Reference to search container for positioning
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  // Alignment offsets for each column based on selected item in previous column
  const [columnOffsets, setColumnOffsets] = useState<number[]>([]);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemRefs = useRef<Record<number, Record<string, HTMLButtonElement | null>>>({});
  const columnsWrapRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [svgSize, setSvgSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  // Track when measurement should be recalculated
  const [measurementTrigger, setMeasurementTrigger] = useState(0);

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
        parent_id: hotel.destination_id,  // Use destination_id instead of subregion_id
        children: [],
        isHotel: true
      };

      const parent = destinationMap.get(hotel.destination_id);
      if (parent) {
        parent.children.push(hotelItem);
      } else if (process.env.NODE_ENV === 'development') {
        console.warn(`Could not find parent subregion for hotel "${hotel.name}" with destination_id: ${hotel.destination_id}`);
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

  // Collect all ancestor ids for a node (closest parent → root)
  const getAncestorIds = useMemo(() => {
    return (startId: string): string[] => {
      const ids: string[] = [];
      let cur: string | null = parentMap[startId] ?? null;
      while (cur) {
        ids.push(cur);
        cur = parentMap[cur] ?? null;
      }
      return ids;
    };
  }, [parentMap]);

  // Collect all descendant ids for a node (deep DFS)
  const getDescendantIds = useMemo(() => {
    return (startId: string): string[] => {
      const root = nodeIndex[startId];
      if (!root) return [];
      const result: string[] = [];
      const visit = (n: DestinationTreeItem) => {
        n.children.forEach((child) => {
          result.push(child.id);
          visit(child);
        });
      };
      visit(root);
      return result;
    };
  }, [nodeIndex]);

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
    // Update expanded path at this depth (browse only; do not select here)
    const newPath = [...activePath.slice(0, depth), node.id];
    setActivePath(newPath);
  };

  // Explicitly add item to selection (triggered by button/checkbox)
  // Also add all ancestor nodes so hierarchy remains consistent.
  const addSelected = (node: DestinationTreeItem) => {
    const already = new Set(value.map(v => v.id));
    const toAddIds = [node.id, ...getAncestorIds(node.id)];
    const additions = toAddIds
      .filter((id) => !already.has(id))
      .map((id) => {
        const n = nodeIndex[id];
        return { id, name: n?.name ?? '', image_url: n?.image_url ?? '', isHotel: n?.isHotel } as SelectedItem;
      });
    if (additions.length > 0) {
      onChange([...value, ...additions]);
    }
  };

  // Toggle selection convenience helper
  const toggleSelected = (node: DestinationTreeItem) => {
    if (value.some(v => v.id === node.id)) {
      removeSelected(node.id);
    } else {
      addSelected(node);
    }
  };

  // Remove a node from selection and cascade to all of its descendants.
  // Ancestors are intentionally retained unless explicitly removed.
  const removeSelected = (id: string) => {
    const toRemove = new Set<string>([id, ...getDescendantIds(id)]);
    onChange(value.filter(v => !toRemove.has(v.id)));
  };

  // Measure and align columns so that column[d] top aligns with selected item in column[d-1]
  // useLayoutEffect(() => {
  //   const offsets: number[] = [];
  //   for (let depth = 1; depth < columns.length; depth++) {
  //     const parentDepth = depth - 1;
  //     const parentId = activePath[parentDepth];
  //     const parentBtn = parentId ? itemRefs.current[parentDepth]?.[parentId] : null;
  //     const parentCol = columnRefs.current[parentDepth];
  //     const thisCol = columnRefs.current[depth];
  //     if (parentBtn && parentCol && thisCol) {
  //       const parentRect = parentBtn.getBoundingClientRect();
  //       const parentColRect = parentCol.getBoundingClientRect();
  //       const offset = Math.max(0, parentRect.top - parentColRect.top);
  //       offsets[depth] = offset;
  //     } else {
  //       offsets[depth] = 0;
  //     }
  //   }
  //   setColumnOffsets(offsets);
    
  //   // Trigger measurement after offsets are set
  //   setTimeout(() => setMeasurementTrigger(prev => prev + 1), 0);
  // }, [columns.length, activePath, query]);


  // Measure and align columns so that column[d] top aligns with selected item in column[d-1]
  useLayoutEffect(() => {
    const offsets: number[] = [0]; // First column always has 0 offset
    
    // Wait for DOM to be fully rendered
    requestAnimationFrame(() => {
      for (let depth = 1; depth < columns.length; depth++) {
        const parentDepth = depth - 1;
        const parentId = activePath[parentDepth];
        const parentBtn = parentId ? itemRefs.current[parentDepth]?.[parentId] : null;
        const scrollContainer = scrollContainerRef.current;
        
        if (parentBtn && scrollContainer) {
          const parentRect = parentBtn.getBoundingClientRect();
          const scrollRect = scrollContainer.getBoundingClientRect();
          
          // Calculate offset: distance from top of scroll container to top of parent button
          // Plus current scroll position to account for any scrolling
          const offset = Math.max(0, (parentRect.top - scrollRect.top) + scrollContainer.scrollTop);
          offsets[depth] = offset;
        } else {
          offsets[depth] = 0;
        }
      }
      
      setColumnOffsets(offsets);
      
      // Trigger measurement after offsets are set
      setTimeout(() => setMeasurementTrigger(prev => prev + 1), 0);
    });
  }, [columns.length, activePath, query]);

  // Build SVG connection paths - improved with proper sequencing
  useLayoutEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    let raf3 = 0;
    let timeoutId: NodeJS.Timeout;

    const measure = () => {
      const container = columnsWrapRef.current;
      const scroller = scrollContainerRef.current;
      if (!container) {
        setPaths([]);
        return;
      }
      const containerRect = (scroller ?? container).getBoundingClientRect();
      const scrollLeft = scroller ? scroller.scrollLeft : 0;
      const scrollTop = scroller ? scroller.scrollTop : 0;
      if (scroller) {
        setSvgSize({ width: scroller.scrollWidth, height: scroller.scrollHeight });
      } else {
        setSvgSize({ width: container.clientWidth, height: container.clientHeight });
      }
      const newPaths: string[] = [];
      for (let depth = 0; depth < activePath.length; depth++) {
        const parentId = activePath[depth];
        const parentEl = itemRefs.current[depth]?.[parentId];
        const nextDepth = depth + 1;
        const children = columns[nextDepth] || [];
        if (!parentEl || children.length === 0) continue;
        const pRect = parentEl.getBoundingClientRect();
        // Start at right-center of parent card (exact side center)
        const startX = (pRect.right - containerRect.left) + scrollLeft;
        const startY = (pRect.top - containerRect.top + pRect.height / 2) + scrollTop;
        for (const child of children) {
          const childEl = itemRefs.current[nextDepth]?.[child.id];
          if (!childEl) continue;
          const cRect = childEl.getBoundingClientRect();
          // End at left-center of child card (exact side center)
          const endX = (cRect.left - containerRect.left) + scrollLeft;
          const endY = (cRect.top - containerRect.top + cRect.height / 2) + scrollTop;
          const dx = Math.max(40, endX - startX);
          const c1x = startX + dx * 0.4;
          const c1y = startY;
          const c2x = endX - dx * 0.4;
          const c2y = endY;
          const d = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
          newPaths.push(d);
        }
      }
      setPaths(newPaths);
    };

    // Use triple RAF plus timeout for better reliability on first click
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        raf3 = requestAnimationFrame(measure);
        // Also measure after a short delay to catch any late-loading images
        timeoutId = setTimeout(measure, 100);
      });
    });

    // Setup observers for ongoing updates
    const ro = new ResizeObserver(() => {
      // Debounce resize measurements
      clearTimeout(timeoutId);
      timeoutId = setTimeout(measure, 50);
    });
    
    if (columnsWrapRef.current) ro.observe(columnsWrapRef.current);
    
    // Listen for image loads in all columns
    const imgs = columnsWrapRef.current?.querySelectorAll('img');
    const listeners: Array<{ el: HTMLImageElement; fn: () => void }> = [];
    imgs?.forEach((img) => {
      const fn = () => {
        // Measure after image loads
        requestAnimationFrame(() => requestAnimationFrame(measure));
      };
      if (!img.complete) {
        img.addEventListener('load', fn);
        listeners.push({ el: img as HTMLImageElement, fn });
      }
    });

    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      if (raf3) cancelAnimationFrame(raf3);
      clearTimeout(timeoutId);
      ro.disconnect();
      listeners.forEach(({ el, fn }) => el.removeEventListener('load', fn));
    };
  }, [columns, activePath, columnOffsets, measurementTrigger]);

  useEffect(() => {
    const onResize = () => setMeasurementTrigger(prev => prev + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Keyboard navigation within columns
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, depth: number, node: DestinationTreeItem, itemsAtDepth: DestinationTreeItem[]) => {
    const ids = itemsAtDepth.map((n) => n.id);
    const idx = ids.indexOf(node.id);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = Math.min(ids.length - 1, idx + 1);
      const nextId = ids[nextIdx];
      const nextRef = itemRefs.current[depth]?.[nextId];
      nextRef?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = Math.max(0, idx - 1);
      const prevId = ids[prevIdx];
      const prevRef = itemRefs.current[depth]?.[prevId];
      prevRef?.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      // open/select node and focus first child in next column
      onClickNode(node, depth);
      const nextDepth = depth + 1;
      const nextItems = getChildren(node.id);
      const firstChild = nextItems[0];
      if (firstChild) {
        // Wait for render
        setTimeout(() => {
          const childRef = itemRefs.current[nextDepth]?.[firstChild.id];
          childRef?.focus();
        }, 0);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const parentId = parentMap[node.id] ?? null;
      if (parentId) {
        const parentDepth = Math.max(0, depth - 1);
        const parentRef = itemRefs.current[parentDepth]?.[parentId];
        parentRef?.focus();
        setActivePath(activePath.slice(0, parentDepth + 1));
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClickNode(node, depth);
    }
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
    const matches = flatItems
      .filter((it) => it.name.toLowerCase().includes(q) || it.pathNames.join(' ').toLowerCase().includes(q))
      .slice(0, 20);
    
    // Update highlighted IDs when search results change
    if (q) {
      const ids = new Set(matches.map(m => m.id));
      setHighlightedIds(ids);
    } else {
      setHighlightedIds(new Set());
    }
    
    return matches;
  }, [query, flatItems, isSearchOpen]);

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
    setIsSearchOpen(false);
  };

  // Handle clicks outside search dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Open search dropdown when query is not empty
  useEffect(() => {
    setIsSearchOpen(query.trim() !== '' && searchMatches.length > 0);
  }, [query, searchMatches.length]);

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
      <div className="relative" ref={searchContainerRef}>
        <input
          className="input"
          placeholder="Search destinations or hotels..."
          value={query}
          onChange={(e) => {
            const newQuery = e.target.value;
            setQuery(newQuery);
            // Show dropdown immediately on input
            if (newQuery.trim() !== '') {
              setIsSearchOpen(true);
            } else {
              setIsSearchOpen(false);
              setHighlightedIds(new Set());
            }
          }}
          aria-expanded={isSearchOpen}
          aria-autocomplete="list"
          aria-controls={isSearchOpen ? "search-results-dropdown" : undefined}
        />
        {/* Search results dropdown - positioned absolutely to avoid layout disruption */}
        {isSearchOpen && (
          <div 
            id="search-results-dropdown"
            className="absolute z-50 mt-1 w-full max-w-md rounded-md border border-gray-200 bg-white shadow-lg"
            role="listbox"
          >
            <div className="max-h-72 overflow-auto py-1 text-sm">
              {searchMatches.length > 0 ? (
                searchMatches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-100 focus:outline-none"
                    onClick={() => onSelectFromSearch(m)}
                    role="option"
                    aria-selected="false"
                  >
                    {m.isHotel ? '🏨' : '📍'} {m.name}
                    {m.pathNames.length > 0 ? (
                      <span className="ml-2 text-gray-500 text-xs">{m.pathNames.join(' > ')}</span>
                    ) : null}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  No destinations found for "{query}"
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Horizontal columns with SVG connection overlay */}
      <div ref={columnsWrapRef} className="relative">
        {/* SVG overlay for subtle connection lines; visible only when a parent is selected */}
        {paths.length > 0 ? (
          <svg
            className="pointer-events-none absolute inset-0 z-0"
            width={svgSize.width || "100%"}
            height={svgSize.height || "100%"}
            aria-hidden="true"
          >
            {paths.map((d, i) => (
              <path key={i} d={d} stroke="#cccccc" strokeWidth="2" fill="none" />
            ))}
          </svg>
        ) : null}
        <div ref={scrollContainerRef} className="relative z-10 flex gap-4 overflow-x-hidden flex-wrap" role="tree" aria-multiselectable="true">
          {columns.map((items, depth) => (
            <div
              key={depth}
              ref={(el) => (columnRefs.current[depth] = el)}
              className="min-w-[260px] w-64 flex-shrink-0 transition-all duration-200"
              style={{ marginTop: columnOffsets[depth] || 0 }}
            >
            <div className="text-sm font-semibold text-gray-700 mb-2">
              {depth === 0 ? 'Main Regions' : depth === 1 ? 'Sub-Regions' : depth === 2 ? 'Hotels' : 'More'}
            </div>
            <div className="space-y-3">
              {items.map((node) => {
                const selected = activePath[depth] === node.id;
                const isHighlighted = highlightedIds.has(node.id);
                return (
                  <button
                    type="button"
                    key={node.id}
                    ref={(el) => {
                      if (!itemRefs.current[depth]) itemRefs.current[depth] = {};
                      itemRefs.current[depth][node.id] = el;
                    }}
                    onClick={() => onClickNode(node, depth)}
                    onKeyDown={(e) => handleKeyDown(e, depth, node, items)}
                    className={`group block rounded-lg border transition-all duration-200 w-[200px] h-[200px] overflow-hidden 
                      ${selected ? 'border-emerald-500 shadow-sm ring-1 ring-emerald-200' : 
                        isHighlighted ? 'border-amber-400 shadow-sm ring-1 ring-amber-200' : 
                        'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}
                    role="treeitem"
                    aria-level={depth + 1}
                    aria-selected={value.some(v => v.id === node.id)}
                    aria-expanded={node.children.length > 0 ? activePath[depth] === node.id : undefined}
                    aria-highlighted={isHighlighted || undefined}
                  >
                    {/* Make image fill 100% of the card area using Next.js Image with fill + object-cover.
                       We keep the card size fixed and expand only the image to remove empty space. */}
                    <div className="relative w-full h-full bg-gray-100">
                      {/* Explicit selection control in the card corner. Using stopPropagation so clicks don't expand. */}
                      <div className="absolute top-2 right-2 z-10">
                        <button
                          type="button"
                          aria-label={value.some(v => v.id === node.id) ? 'Remove from plan' : 'Add to plan'}
                          aria-pressed={value.some(v => v.id === node.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelected(node);
                          }}
                          className={`${value.some(v => v.id === node.id) ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-white/90 text-gray-700 hover:bg-white'} border border-gray-200 rounded px-2 py-1 text-xs font-medium shadow-sm`}
                        >
                          {value.some(v => v.id === node.id) ? 'Added' : 'Add'}
                        </button>
                      </div>
                      {typeof node.image_url === 'string' && node.image_url.trim() ? (
                        <Image
                          src={node.image_url}
                          alt={`${node.name} image`}
                          fill
                          quality={85}
                          sizes="(max-width: 768px) 80vw, 200px"
                          className="object-cover"
                          priority={depth === 0 && items.indexOf(node) === 0}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">{node.isHotel ? '🏨' : '📍'}</div>
                      )}
                      <div className={`absolute inset-x-0 bottom-0 px-2 py-1 ${selected ? 'bg-emerald-600/70' : 'bg-black/50'} transition-colors`}>
                        <span className="text-xs font-medium text-white line-clamp-1">{node.name}</span>
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
    </div>
  );
}