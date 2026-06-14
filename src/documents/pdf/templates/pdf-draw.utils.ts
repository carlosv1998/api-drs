import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib';

export function texto(
  page: PDFPage,
  font: PDFFont,
  s: string,
  x: number,
  y: number,
  size: number,
  maxW?: number,
): void {
  if (!s) return;
  let fz = size;
  if (maxW) {
    while (fz > 4 && font.widthOfTextAtSize(s, fz) > maxW) fz -= 0.25;
  }
  page.drawText(s, { x, y, size: fz, font, color: rgb(0, 0, 0) });
}

export function textoCentrado(
  page: PDFPage,
  font: PDFFont,
  s: string,
  xc: number,
  y: number,
  size: number,
): void {
  if (!s) return;
  const w = font.widthOfTextAtSize(s, size);
  page.drawText(s, { x: xc - w / 2, y, size, font, color: rgb(0, 0, 0) });
}

// ✓ verde / ✗ rojo — convención SI=teal, NO=rojo
export function tick(page: PDFPage, xc: number, yc: number, si: boolean): void {
  const t = 1.2;
  if (si) {
    const c = rgb(0, 155 / 255, 158 / 255);
    page.drawLine({ start: { x: xc - 3.2, y: yc - 0.2 }, end: { x: xc - 0.8, y: yc - 2.8 }, thickness: t, color: c });
    page.drawLine({ start: { x: xc - 0.8, y: yc - 2.8 }, end: { x: xc + 3.6, y: yc + 3.0 }, thickness: t, color: c });
  } else {
    const c = rgb(204 / 255, 18 / 255, 18 / 255);
    page.drawLine({ start: { x: xc - 2.8, y: yc - 2.8 }, end: { x: xc + 2.8, y: yc + 2.8 }, thickness: t, color: c });
    page.drawLine({ start: { x: xc - 2.8, y: yc + 2.8 }, end: { x: xc + 2.8, y: yc - 2.8 }, thickness: t, color: c });
  }
}

export function envolver(font: PDFFont, s: string, size: number, maxW: number): string[] {
  const palabras = (s ?? '').split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = '';
  for (const p of palabras) {
    const intento = actual ? `${actual} ${p}` : p;
    if (font.widthOfTextAtSize(intento, size) <= maxW) actual = intento;
    else {
      if (actual) lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

export async function dibujarFirma(
  doc: PDFDocument,
  page: PDFPage,
  dataUrl: string | undefined,
  xc: number,
  yc: number,
  maxW: number,
  maxH: number,
): Promise<void> {
  if (!dataUrl) return;
  try {
    const base64 = dataUrl.replace(/^data:image\/(png|jpe?g);base64,/, '');
    const bytes = Buffer.from(base64, 'base64');
    const img =
      dataUrl.includes('jpeg') || dataUrl.includes('jpg')
        ? await doc.embedJpg(bytes)
        : await doc.embedPng(bytes);
    const escala = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = img.width * escala;
    const h = img.height * escala;
    page.drawImage(img, { x: xc - w / 2, y: yc - h / 2, width: w, height: h });
  } catch {
    // firma inválida: se omite sin romper la generación
  }
}
