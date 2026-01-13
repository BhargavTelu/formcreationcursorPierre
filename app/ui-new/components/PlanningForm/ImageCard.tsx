"use client";

interface ImageCardProps {
  image: string;
  title: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "default" | "small";
}

export function ImageCard({
  image,
  title,
  selected = false,
  onClick,
  size = "default",
}: ImageCardProps) {
  const isSmall = size === "small";

  return (
    <button
      type="button"   // ✅ CRITICAL
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border transition
        ${isSmall ? "h-28" : "h-40"}
        ${
          selected
            ? "border-amber-600 ring-2 ring-amber-200"
            : "border-gray-300 hover:border-gray-400"
        }
      `}
    >
      {/* IMAGE */}
      <img
        src={image}
        alt={title}
        loading="lazy"
        referrerPolicy="no-referrer"   // ✅ FIXES UNSPLASH EDGE CASES
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/30" />

      {/* TITLE */}
      <div className="absolute bottom-0 inset-x-0 p-2">
        <h3
          className={`text-white font-medium leading-tight ${
            isSmall ? "text-xs" : "text-sm"
          }`}
        >
          {title}
        </h3>
      </div>

      {/* CHECKMARK */}
      {selected && (
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center">
          ✓
        </div>
      )}
    </button>
  );
}
