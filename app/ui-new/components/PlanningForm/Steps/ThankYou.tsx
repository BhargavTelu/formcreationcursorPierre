"use client";

import { useEffect, useMemo, useState } from "react";
import { StepWrapper } from "../StepWrapper";
import { TripData } from "../../../types/TripPlanner";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle,
  User,
  Users,
  Calendar,
  MapPin,
  Sparkles,
  Clock,
  Gauge,
  Download,
  Home,
} from "lucide-react";

interface ThankYouProps {
  data: TripData;
  onExit: () => void;
}

interface DestinationRow {
  id: string;
  name: string;
  parent_id: string | null;
}

/* ---------- LABEL MAPS ---------- */

const EXPERIENCE_LABELS: Record<string, string> = {
  beach: "Beach & Coast",
  nature: "Nature & Scenic",
  safari: "Safari & Wildlife",
  "food-wine": "Food & Wine",
  city: "City & Culture",
  adventure: "Adventure",
  history: "History & Local Life",
};

const PACE_LABELS: Record<string, string> = {
  relaxed: "Unhurried",
  balanced: "Balanced",
  active: "Full days",
};

/* ---------- MAIN ---------- */

export default function ThankYou({ data, onExit }: ThankYouProps) {
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);

  useEffect(() => {
    supabase
      .from("destinations")
      .select("id, name, parent_id")
      .then(({ data }) => setDestinations(data || []));
  }, []);

  const destinationMap = useMemo(() => {
    const map: Record<string, string> = {};
    destinations.forEach((d) => {
      map[d.id] = d.name;
    });
    return map;
  }, [destinations]);

  const destinationText =
    data.destinations.length === 0
      ? "Not selected"
      : data.destinations
          .map((d) => {
            const regionName = destinationMap[d.id] ?? d.id;

            if (!d.subRegions.length) return regionName;

            const subs = d.subRegions
              .map((id) => destinationMap[id] ?? id)
              .join(", ");

            return `${regionName} (${subs})`;
          })
          .join(", ");

  /* ---------- PDF ---------- */

  const downloadPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 24;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("Your Journey Summary", pageWidth / 2, y, { align: "center" });

    y += 10;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(100);
    pdf.text(
      "Review of your submitted travel preferences",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    y += 14;

    const cardX = 16;
    const cardWidth = pageWidth - 32;

    const drawRow = (label: string, value: string) => {
      pdf.setDrawColor(230);
      pdf.line(cardX, y, cardX + cardWidth, y);

      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(120);
      pdf.text(label, cardX + 2, y);

      y += 5;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(30);
      pdf.text(value || "—", cardX + 2, y);

      y += 10;
    };

    pdf.line(cardX, y, cardX + cardWidth, y);

    drawRow("Traveller", data.travelerName);
    drawRow("Group size", `${data.groupSize} people`);
    drawRow(
      "Travel timing",
      data.travelMonths.join(", ") || data.specificDate || "Flexible"
    );
    drawRow("Journey type", "Custom trip design");
    drawRow("Duration", data.lengthOfStay || "—");
    drawRow("Destinations", destinationText);
    drawRow(
      "Experiences",
      data.experiences.length
        ? data.experiences.map((e) => EXPERIENCE_LABELS[e]).join(", ")
        : "Not selected"
    );
    drawRow("Pace", PACE_LABELS[data.pace] || "—");

    pdf.line(cardX, y - 4, cardX + cardWidth, y - 4);

    y += 10;
    pdf.setFontSize(9);
    pdf.setTextColor(150);
    pdf.text(
      "A travel designer will contact you within 24 hours.",
      pageWidth / 2,
      y,
      { align: "center" }
    );

    const safeName =
      data.travelerName
        ?.trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") || "traveler";

    pdf.save(`travel-request-${safeName}.pdf`);
  };

  /* ---------- UI ---------- */

  return (
    <StepWrapper
      title="You're all set"
      subtitle="Your journey request has been successfully submitted"
    >
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-center gap-3 text-emerald-700">
          <CheckCircle className="w-6 h-6" />
          <p className="text-lg font-medium">
            A travel designer will contact you within 24 hours
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={downloadPDF}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-full border border-amber-700 text-amber-700 font-medium hover:bg-amber-50 transition"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          <button
            onClick={onExit}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-amber-700 text-white font-medium hover:bg-amber-800 transition"
          >
            <Home className="w-4 h-4" />
            Back to homepage
          </button>
        </div>
      </div>
    </StepWrapper>
  );
}
