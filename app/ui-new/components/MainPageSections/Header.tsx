"use client";

type HeaderVariant = "marketing" | "planner";

interface HeaderProps {
  variant: HeaderVariant;

  // marketing
  onPlanTrip?: () => void;
  onChatExpert?: () => void;
  onLogoClick?: () => void;

  // planner
  step?: number;
  totalSteps?: number;
  onExit?: () => void;
}

export default function Header(props: HeaderProps) {
  const { variant, step, totalSteps } = props;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl h-16 mx-auto px-8">
        <div className="flex items-center justify-between h-16 md:h-26">
          
          <button
            onClick={props.onLogoClick}
            className="text-xl md:text-2xl font-serif text-amber-700 font-medium"
          >
            Finest Africa
          </button>

          {/* CENTER (planner only) */}
          {variant === "planner" && step && totalSteps && (
            <div className="mr-20">
              {/* <span className="text-sm text-gray-600 font-medium">
              Step {step} of {totalSteps}
            </span> */}
              </div>
          )}

          {/* RIGHT */}
          {variant === "marketing" ? (
            <nav className="hidden md:flex items-center gap-6">
              <a className="text-sm hover:text-amber-700" href="#">
                Destinations
              </a>
              <a className="text-sm hover:text-amber-700" href="#">
                About
              </a>

              <button
                onClick={props.onChatExpert}
                className="px-5 py-2 rounded border border-amber-700 hover:bg-amber-700 hover:text-white transition"
              >
                Chat with Expert
              </button>

              <button
                onClick={props.onPlanTrip}
                className="px-7 py-2 rounded border border-amber-700 hover:bg-amber-700 hover:text-white transition"
              >
                Plan My Trip
              </button>
            </nav>
          ) : (
            <button
              onClick={props.onExit}
              className="text-sm hover:text-amber-700"
            >
              Exit
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
