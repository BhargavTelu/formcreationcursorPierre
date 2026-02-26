"use client";

import { StepWrapper } from "../StepWrapper";
import { TripData } from "../../../types/TripPlanner";
import { EXPERIENCE_LABELS, ACCOMMODATION_LABELS, PACE_LABELS } from "../../../types/labels";
import jsPDF from "jspdf";
import {
  CheckCircle,
  Download,
  Home,
} from "lucide-react";

/* ================= TYPES ================= */

interface ThankYouProps {
  data: TripData;
  onExit: () => void;
}

/* ================= COMPONENT ================= */

export default function ThankYou({ data, onExit }: ThankYouProps) {
  /* ---------- FORMAT DESTINATIONS ---------- */

  const destinationText =
    data.destinations.length === 0
      ? "Not selected"
      : data.destinations
          .map((d) => {
            const region = d.name || d.id;

            if (!d.subRegions.length) return region;

            const subs = d.subRegions
              .map((sub) => sub.name || sub.id)
              .join(", ");

            return `${region}: ${subs}`;
          })
          .join(" | ");

  /* ---------- FORMAT ACCOMMODATION ---------- */

  const accommodationText =
    data.accommodationTypes.length > 0
      ? data.accommodationTypes
          .map((a) => ACCOMMODATION_LABELS[a] ?? a)
          .join(", ")
      : "Not specified";

  /* ---------- FORMAT GOLF ---------- */

  const golfText = data.includesGolf
    ? `${data.golfRounds ?? 1} round${data.golfRounds === 1 ? "" : "s"}`
    : "Not included";

  const golfCoursesText =
    data.mustHaveGolfCourses && data.mustHaveGolfCourses.length > 0
      ? data.mustHaveGolfCourses.join(", ")
      : "Designer selection";

  /* ================= PDF ================= */

  const downloadPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 24;

    const drawRow = (label: string, value: string) => {
      pdf.setDrawColor(230);
      pdf.line(16, y, pageWidth - 16, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(120);
      pdf.text(label, 18, y);

      y += 5;
      pdf.setFontSize(11);
      pdf.setTextColor(30);
      pdf.text(value || "—", 18, y);

      y += 10;
    };

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("Your Journey Summary", pageWidth / 2, y, { align: "center" });
    y += 18;

    drawRow("Traveller", data.travelerName);
    drawRow("Group size", `${data.groupSize} people`);
    drawRow(
      "Travel timing",
      data.travelMonths.join(", ") || data.specificDate || "Flexible"
    );
    drawRow("Duration", data.lengthOfStay || "—");
    drawRow("Destinations", destinationText);
    drawRow(
      "Experiences",
      data.experiences.length
        ? data.experiences.map((e) => EXPERIENCE_LABELS[e] ?? e).join(", ")
        : "Not selected"
    );
    drawRow("Accommodation", accommodationText);
    drawRow("Golf", golfText);
    drawRow("Golf courses", golfCoursesText);
    drawRow("Pace", PACE_LABELS[data.pace] || "—");

    const safeName =
      data.travelerName
        ?.trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") || "traveler";

    pdf.save(`travel-request-${safeName}.pdf`);
  };

  /* ================= UI ================= */

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
