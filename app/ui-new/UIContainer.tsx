"use client";

import { useState } from "react";
import Header from "./components/MainPageSections/Header";
import LandingPage from "./components/MainPageSections/LandingPage";
import TripPlanner from "./components/PlanningForm/TripPlanner";
import { FeaturesSection } from "./components/MainPageSections/FeaturesSection";
import { Footer } from "./components/MainPageSections/Footer";
import { DestinationsPreview } from "./components/MainPageSections/DestinationsPreview";
import  ChatPanel  from "./components/Chat/ChatPanel";

export default function UIContainer() {
  const [showPlanner, setShowPlanner] = useState(false);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 relative">
      {!showPlanner ? (
        <>
          <Header
            variant="marketing"
            onLogoClick={() => setShowPlanner(false)}
            onPlanTrip={() => setShowPlanner(true)}
            onChatExpert={() => setShowChat(true)}
          />

          <div className="pt-16">
            <LandingPage
              onPlanTrip={() => setShowPlanner(true)}
              onChatExpert={() => setShowChat(true)}
            />
            <FeaturesSection />
            <DestinationsPreview onPlanTrip={() => setShowPlanner(true)} />
            <Footer />
          </div>
        </>
      ) : (
        <TripPlanner onExit={() => setShowPlanner(false)} />
      )}

      {/* Chat Panel */}
      <ChatPanel isOpen={showChat} onClose={() => setShowChat(false)} />
    </div>
  );
}
