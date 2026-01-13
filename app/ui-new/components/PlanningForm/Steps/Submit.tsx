"use client";

import { StepWrapper } from "../StepWrapper";
import { TripData } from "../../../types/TripPlanner";
import { useState } from "react";
import jsPDF from "jspdf";

interface SubmitProps {
  data: TripData;
  onExit?: () => void;
}

export default function Submit({ data, onExit }: SubmitProps) {
  const [loading, setLoading] = useState(false);

  const generatePDF = () => {
    const pdf = new jsPDF();

    let y = 20;

    const add = (label: string, value: string) => {
      pdf.text(`${label}: ${value}`, 20, y);
      y += 8;
    };

    pdf.setFontSize(18);
    pdf.text("Travel Request Summary", 20, y);
    y += 12;

    pdf.setFontSize(11);
    add("Traveller", data.travelerName);
    add("Group Size", String(data.groupSize));
    add(
      "Travel Time",
      data.travelMonths.join(", ") || data.specificDate || "Flexible"
    );
    add("Journey Type", data.journeyType);
    add("Length of Stay", data.lengthOfStay);
    add("Pace", data.pace);

    y += 6;
    pdf.text("Destinations:", 20, y);
    y += 8;
    data.destinations.forEach((d) => {
      pdf.text(`• ${d.id}`, 24, y);
      y += 6;
    });

    y += 4;
    pdf.text("Experiences:", 20, y);
    y += 8;
    data.experiences.forEach((e) => {
      pdf.text(`• ${e}`, 24, y);
      y += 6;
    });

    if (data.accommodationTypes.length) {
      y += 4;
      pdf.text("Accommodation Types:", 20, y);
      y += 8;
      data.accommodationTypes.forEach((a) => {
        pdf.text(`• ${a}`, 24, y);
        y += 6;
      });
    }

    if (data.generalNotes) {
      y += 4;
      pdf.text("Notes:", 20, y);
      y += 8;
      pdf.text(data.generalNotes, 24, y);
    }

    pdf.save("travel-request.pdf");
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await fetch("/api/trip-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      generatePDF();
      onExit?.();
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepWrapper
      title="You're all set!"
      subtitle="Submit your travel request"
    >
      <div className="max-w-md mx-auto text-center space-y-6">
        <p className="text-muted-foreground">
          We’ll start designing your journey based on your preferences.
        </p>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-full bg-amber-700 text-white font-medium hover:bg-amber-800 transition"
        >
          {loading ? "Submitting..." : "Submit & Download PDF"}
        </button>
      </div>
    </StepWrapper>
  );
}
