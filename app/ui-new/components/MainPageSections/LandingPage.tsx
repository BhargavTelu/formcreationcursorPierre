"use client";

import { ArrowRight, MessagesSquare } from "lucide-react";

interface LandingPageProps {
  onPlanTrip: () => void;
  onChatExpert: () => void;
}

export default function LandingPage({
  onPlanTrip,
  onChatExpert,
}: LandingPageProps) {
  return (
    <section
      id="landing"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <img
        src="/images/MainBG.jpg"
        alt="African safari landscape"
        className="absolute inset-0 w-full h-full object-cover scale-105"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl px-6 text-center animate-fade-in">
        {/* Eyebrow */}
        <p className="text-sm tracking-[0.3em] text-amber-400 mb-6">
          BESPOKE AFRICAN JOURNEYS
        </p>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl font-serif text-white leading-tight mb-6">
          Design Your <span className="text-amber-400">Dream African</span>
          <br className="hidden sm:block" />
          Journey
        </h1>

        {/* Description */}
        <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-12">
          Handcrafted luxury safaris, private guides, and unforgettable moments —
          tailored entirely around you.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onPlanTrip}
            className="
              group flex items-center justify-center gap-3
              px-10 py-4 rounded
              bg-amber-700 text-white
              hover:bg-amber-800 transition
            "
          >
            Plan My Trip
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onChatExpert}
            className="
              group flex items-center justify-center gap-3
              px-10 py-4 rounded
              border border-white/60 text-white
              hover:bg-white/10 transition
            "
          >
            <MessagesSquare className="w-5 h-5" />
            Chat with Expert
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-xs tracking-widest">
        SCROLL
      </div>

      {/* Local animation (no dependency) */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeInUp 0.8s ease-out both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
