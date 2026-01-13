"use client";

import { useState, useEffect } from "react";
import Header from "./components/MainPageSections/Header";
import LandingPage from "./components/MainPageSections/LandingPage";
import TripPlanner from "./components/PlanningForm/TripPlanner";
import { FeaturesSection } from "./components/MainPageSections/FeaturesSection";
import { Footer } from "./components/MainPageSections/Footer";
import { DestinationsPreview } from "./components/MainPageSections/DestinationsPreview";

export default function UIContainer() {
  const [showPlanner, setShowPlanner] = useState(false);
  const [showChatNotice, setShowChatNotice] = useState(false);

  // Optional: auto-hide toast after 3 seconds
  useEffect(() => {
    if (!showChatNotice) return;

    const timer = setTimeout(() => {
      setShowChatNotice(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showChatNotice]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {!showPlanner ? (
        <>
          <Header
            variant="marketing"
            onLogoClick={() => setShowPlanner(false)}
            onPlanTrip={() => setShowPlanner(true)}
            onChatExpert={() => setShowChatNotice(true)}
          />

          {/* Fixed header offset */}
          <div className="pt-16">
            <LandingPage
              onPlanTrip={() => setShowPlanner(true)}
              onChatExpert={() => setShowChatNotice(true)}
            />

            <FeaturesSection />
            <DestinationsPreview onPlanTrip={() => setShowPlanner(true)} />
            <Footer />
          </div>
        </>
      ) : (
        <TripPlanner onExit={() => setShowPlanner(false)} />
      )}

      {/* Chat with Expert Toast */}
      {showChatNotice && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div
            className="
              flex items-center gap-3
              rounded
              bg-stone-900
              px-6 py-4
              text-m text-white
              shadow-xl
              animate-fade-in
            "
          >
            <span className="text-amber-400">✦</span>
            <span>Chat with an expert is launching soon.</span>

            <button
              onClick={() => setShowChatNotice(false)}
              className="ml-4 text-white/60 hover:text-white transition"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
