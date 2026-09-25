import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const NAVY = rgb(11 / 255, 20 / 255, 38 / 255);
const BLUE = rgb(25 / 255, 59 / 255, 104 / 255);
const GOLD = rgb(214 / 255, 182 / 255, 107 / 255);
const SLATE = rgb(84 / 255, 94 / 255, 115 / 255);

export interface CertificateData {
  learnerName: string;
  courseTitle: string;
  issuedAt: Date;
  number: string;
  verificationCode: string;
  verificationUrl: string;
  cpdHours?: number | null;
  score?: number | null;
}

/** Generates an A4 landscape completion certificate PDF. */
export async function renderCertificatePdf(c: CertificateData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificate of Completion — ${c.courseTitle}`);
  pdf.setAuthor("FinCrime Academy");
  pdf.setSubject(`Certificate ${c.number}`);
  const page = pdf.addPage([841.89, 595.28]);
  const { width: W, height: H } = page.getSize();
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: NAVY, borderWidth: 6 });
  page.drawRectangle({ x: 32, y: 32, width: W - 64, height: H - 64, borderColor: GOLD, borderWidth: 1.5 });
  page.drawRectangle({ x: 32, y: H - 110, width: W - 64, height: 78, color: NAVY });

  const center = (text: string, y: number, font = sans, size = 12, color = NAVY) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (W - w) / 2, y, size, font, color });
  };
  const fit = (text: string, font: typeof sans, max: number, start: number) => {
    let s = start;
    while (font.widthOfTextAtSize(text, s) > max && s > 12) s -= 1;
    return s;
  };

  center("FINCRIME ACADEMY", H - 70, sansBold, 20, GOLD);
  center("Master Financial Crime. Strengthen Compliance. Advance Your Career.", H - 92, sans, 9, rgb(0.85, 0.87, 0.92));
  center("CERTIFICATE OF COMPLETION", H - 160, sansBold, 14, BLUE);
  center("This is to certify that", H - 200, serifItalic, 14, SLATE);
  center(c.learnerName, H - 250, serif, fit(c.learnerName, serif, W - 180, 38), NAVY);
  page.drawLine({ start: { x: W / 2 - 180, y: H - 262 }, end: { x: W / 2 + 180, y: H - 262 }, thickness: 1, color: GOLD });
  center("has successfully completed the course", H - 292, serifItalic, 14, SLATE);
  center(c.courseTitle, H - 330, serif, fit(c.courseTitle, serif, W - 160, 26), BLUE);
  const extra = [c.score != null ? `Final assessment: ${c.score}%` : null, c.cpdHours ? `CPD hours (indicative): ${c.cpdHours}` : null].filter(Boolean).join("   ·   ");
  if (extra) center(extra, H - 360, sans, 11, SLATE);

  const issued = c.issuedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const left = 80, base = 120;
  page.drawText("Issue date", { x: left, y: base + 18, size: 9, font: sans, color: SLATE });
  page.drawText(issued, { x: left, y: base, size: 12, font: sansBold, color: NAVY });
  page.drawText("Certificate number", { x: left + 200, y: base + 18, size: 9, font: sans, color: SLATE });
  page.drawText(c.number, { x: left + 200, y: base, size: 12, font: sansBold, color: NAVY });
  page.drawText("Verification code", { x: left + 400, y: base + 18, size: 9, font: sans, color: SLATE });
  page.drawText(c.verificationCode, { x: left + 400, y: base, size: 12, font: sansBold, color: NAVY });
  page.drawText("Issued by FinCrime Academy", { x: W - 260, y: base, size: 11, font: sansBold, color: NAVY });
  page.drawLine({ start: { x: W - 260, y: base + 16 }, end: { x: W - 80, y: base + 16 }, thickness: 0.8, color: GOLD });

  center(`Verify at ${c.verificationUrl}`, 78, sans, 9, BLUE);
  center("Internal completion certificate issued by FinCrime Academy. Not an external accredited qualification.", 60, sans, 8, SLATE);
  return pdf.save();
}
