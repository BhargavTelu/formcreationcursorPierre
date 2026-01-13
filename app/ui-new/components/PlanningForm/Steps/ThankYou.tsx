"use client";

import { StepWrapper } from "../StepWrapper";
import { TripData } from "../../../types/TripPlanner";
import jsPDF from "jspdf";
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

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b last:border-b-0">
      <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-stone-500" />
      </div>

      <div>
        <p className="text-xs text-stone-500">{label}</p>
        <p className="text-sm font-medium text-stone-900">{value}</p>
      </div>
    </div>
  );
}

export default function ThankYou({ data, onExit }: ThankYouProps) {
 const downloadPDF = () => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();

  let y = 24;

  // ===== Title =====
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

  // ===== Card container =====
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

  // Top border
  pdf.setDrawColor(230);
  pdf.line(cardX, y, cardX + cardWidth, y);

  // ===== Content =====
  drawRow("Traveller", data.travelerName);
  drawRow("Group size", `${data.groupSize} people`);
  drawRow(
    "Travel timing",
    data.travelMonths.join(", ") || data.specificDate || "Flexible"
  );
  drawRow("Journey type", data.journeyType || "Custom trip design");
  drawRow("Duration", data.lengthOfStay || "—");
  drawRow(
    "Destinations",
    data.destinations.length
      ? data.destinations.map(d => d.id.replace(/-/g, " ")).join(", ")
      : "Not selected"
  );
  drawRow(
    "Experiences",
    data.experiences.length ? data.experiences.join(", ") : "Not selected"
  );
  drawRow("Pace", data.pace || "—");

  // Bottom border
  pdf.line(cardX, y - 4, cardX + cardWidth, y - 4);

  // ===== Footer =====
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


  return (
    <StepWrapper
      title="You're all set"
      subtitle="Your journey request has been successfully submitted"
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success header */}
        <div className="flex items-center justify-center gap-3 text-emerald-700">
          <CheckCircle className="w-6 h-6" />
          <p className="text-lg font-medium">
            A travel designer will contact you within 24 hours
          </p>
        </div>

        {/* Summary card */}
        {/* <div className="bg-white rounded-3xl border border-stone-200 px-8 py-6 shadow-md">
          <Row icon={User} label="Traveller" value={data.travelerName || "—"} />
          <Row icon={Users} label="Group size" value={`${data.groupSize} people`} />
          <Row
            icon={Calendar}
            label="Travel timing"
            value={data.travelMonths.join(", ") || data.specificDate || "Flexible"}
          />
          <Row icon={Clock} label="Duration" value={data.lengthOfStay || "—"} />
          <Row
            icon={MapPin}
            label="Destinations"
            value={
              data.destinations.length
                ? data.destinations.map(d => d.id.replace(/-/g, " ")).join(", ")
                : "Not selected"
            }
          />
          <Row
            icon={Sparkles}
            label="Experiences"
            value={data.experiences.join(", ") || "Not selected"}
          />
          <Row icon={Gauge} label="Pace" value={data.pace || "—"} />
        </div> */}

        {/* Actions */}
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
