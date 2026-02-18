import { NextRequest } from "next/server";
import { loadItineraries } from "../../store";

type Ctx = { params: { id: string } };

function escapePdfText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]) {
  const content = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
    ...lines.flatMap((line, i) => (i === 0 ? [`(${escapePdfText(line)}) Tj`] : ["0 -16 Td", `(${escapePdfText(line)}) Tj`])),
    "ET",
  ].join("\n");

  const objs = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const xref: number[] = [0];
  for (const obj of objs) {
    xref.push(pdf.length);
    pdf += `${obj}\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objs.length; i++) {
    pdf += `${String(xref[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}

export async function GET(_: NextRequest, { params }: Ctx) {
  const rows = await loadItineraries();
  const row = rows.find((r) => r.id === params.id);
  if (!row) return new Response("Not found", { status: 404 });

  const lines = [
    "PortTrip Concierge Itinerary",
    `${row.port} | ${row.ship_name}`,
    `Arrival: ${row.arrival_time} | All aboard: ${row.all_aboard_time}`,
    `Safety buffer: ${row.safety_buffer} min | Risk score: ${row.risk_score}`,
    "",
    ...row.itinerary_json.blocks.slice(0, 20).map((b) => `${b.start}-${b.end} ${b.title} (€${b.costEur || 0})`),
  ];

  const pdf = buildSimplePdf(lines);
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${row.port}-itinerary.pdf"`,
    },
  });
}
