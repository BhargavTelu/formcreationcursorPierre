import PDFDocument from "pdfkit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const data = await req.json();

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      // ✅ Fix #1: Buffer.concat typing
      resolve(Buffer.concat(buffers as any));
    });

    // ===== PDF CONTENT =====
    doc.fontSize(22).text("Travel Request Summary", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(12);

    doc.text(`Traveller: ${data.travelerName}`);
    doc.text(`Group Size: ${data.groupSize}`);
    doc.text(`Journey Type: ${data.journeyType}`);
    doc.text(`Length of Stay: ${data.lengthOfStay}`);
    doc.text(`Pace: ${data.pace}`);

    doc.moveDown();
    doc.text("Destinations:");
    data.destinations.forEach((d: any) => doc.text(`• ${d.id}`));

    doc.moveDown();
    doc.text("Experiences:");
    data.experiences.forEach((e: string) => doc.text(`• ${e}`));

    doc.moveDown();
    doc.text("Accommodation:");
    data.accommodationTypes.forEach((a: string) => doc.text(`• ${a}`));

    if (data.generalNotes) {
      doc.moveDown();
      doc.text("Notes:");
      doc.text(data.generalNotes);
    }

    doc.end();
  });

  // ✅ Fix #2: HARD Web boundary (this is REQUIRED)
  const arrayBuffer = pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength
  ) as ArrayBuffer;

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="travel-request.pdf"',
    },
  });
}
