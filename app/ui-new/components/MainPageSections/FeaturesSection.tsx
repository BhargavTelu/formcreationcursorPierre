"use client";

import { Compass, Users, Shield, Sparkles } from "lucide-react";
import { useScrollReveal } from "@/app/ui-new/hooks/useScrollReveal";

const FEATURES = [
  {
    title: "Expert-Crafted Journeys",
    description:
      "Every itinerary is thoughtfully designed by specialists who know Africa intimately — not from research, but from experience.",
    icon: Compass,
  },
  {
    title: "Personal Travel Designers",
    description:
      "You’ll work one-on-one with a dedicated expert who understands your pace, interests, and style of travel.",
    icon: Users,
  },
  {
    title: "Trusted & Protected",
    description:
      "Travel with complete confidence. We’re fully bonded, insured, and partner only with the most reputable operators.",
    icon: Shield,
  },
  {
    title: "Unforgettable Moments",
    description:
      "From private sundowners to once-in-a-lifetime wildlife encounters — we craft moments that stay with you forever.",
    icon: Sparkles,
  },
];

export const FeaturesSection = () => {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  return (
    <section className="section-lg bg-white">
      <div
        ref={ref}
        className={`max-w-7xl mx-auto px-6 reveal ${
          visible ? "reveal-visible" : ""
        }`}
      >
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-serif mb-6">
            Why Travel With Us
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            Extraordinary journeys are built on deep knowledge, thoughtful
            design, and genuine care — never templates.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className={`
                  group
                  rounded-3xl
                  bg-stone-50
                  p-8
                  text-center
                  transition
                  hover:-translate-y-1
                  hover:shadow-xl
                  reveal
                  ${visible ? "reveal-visible" : ""}
                `}
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-100 flex items-center justify-center transition group-hover:scale-110">
                  <Icon className="w-8 h-8 text-amber-800" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-serif mb-4">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
