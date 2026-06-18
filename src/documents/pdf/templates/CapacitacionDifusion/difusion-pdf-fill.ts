import { PDFDocument, PDFFont, PDFPage, StandardFonts } from 'pdf-lib';
import { DATOS, FOOTER, PARTICIPANTES, TEMA } from './difusion-pdf.coords';
import { dibujarFirma, envolver, texto, tick } from '../pdf-draw.utils';
import { CreateCapacitacionDifusionDataDto } from 'src/documents/dtos/capacitacion-difusion-data.dto';
import {
  IDocumentCapacitacionDifusionRelatorData,
  IDocumentCapacitacionDifusionTrabajadorData,
} from 'src/documents/interfaces/document-capacitacion-difusion-data.interface';

const POR_PAGINA = 15;

// ── Entry point ───────────────────────────────────────────────

export async function fillCapacitacionDifusion(
  outputDoc: PDFDocument,
  templateBytes: Buffer,
  data: CreateCapacitacionDifusionDataDto,
  relator: IDocumentCapacitacionDifusionRelatorData,
  participantes: IDocumentCapacitacionDifusionTrabajadorData[],
): Promise<void> {
  const font = await outputDoc.embedFont(StandardFonts.Helvetica);
  const paginas = Math.ceil(participantes.length / POR_PAGINA) || 1;

  for (let p = 0; p < paginas; p++) {
    const plantilla = await PDFDocument.load(templateBytes);
    const [pagina] = await outputDoc.copyPages(plantilla, [0]);
    outputDoc.addPage(pagina);
    const page = outputDoc.getPages()[p];

    fillDatos(page, data, relator, font);
    fillTema(page, data.temaPrincipal, font);

    const slice = participantes.slice(p * POR_PAGINA, (p + 1) * POR_PAGINA);
    await fillParticipantes(outputDoc, page, slice, font);

    await fillFooter(outputDoc, page, data, relator, participantes.length, font);
  }
}

export function buildCapacitacionDifusionFileName(docId: string, fecha: Date): string {
  const fechaStr = fecha.toISOString().slice(0, 10).replace(/-/g, '');
  return `capacitaciones/CAP_DIFUSION_${docId}_${fechaStr}.pdf`;
}

// ── Sección 1: Datos de la actividad ──────────────────────────

function fillDatos(
  page: PDFPage,
  data: CreateCapacitacionDifusionDataDto,
  relator: IDocumentCapacitacionDifusionRelatorData,
  f: PDFFont,
): void {
  const D = DATOS;

  const tipoMap: Record<string, { xc: number; y: number }> = {
    'charla-de-seguridad': D.tipoActividad.charlaSeg,
    capacitacion:          D.tipoActividad.capacitacion,
    reflexion:             D.tipoActividad.reflexion,
    reunion:               D.tipoActividad.reunion,
  };
  const tipoPos = tipoMap[data.tipoActividad];
  if (tipoPos) tick(page, tipoPos.xc, tipoPos.y, true);

  if (data.modalidad === 'interna') tick(page, D.modalidad.interna.xc, D.modalidad.interna.y, true);
  if (data.modalidad === 'externa') tick(page, D.modalidad.externa.xc, D.modalidad.externa.y, true);

  if (data.asistencia === 'presencial') tick(page, D.asistencia.presencial.xc, D.asistencia.presencial.y, true);
  if (data.asistencia === 'e-learning') tick(page, D.asistencia.elearning.xc,  D.asistencia.elearning.y,  true);

  texto(page, f, relator.nombre,  D.relator.x,   D.relator.y,   D.relator.size,   D.relator.maxW);
  texto(page, f, relator.rut,     D.rut.x,       D.rut.y,       D.rut.size,       D.rut.maxW);
  texto(page, f, relator.cargo,   D.cargo.x,     D.cargo.y,     D.cargo.size,     D.cargo.maxW);
  texto(page, f, data.ubicacion,  D.ubicacion.x, D.ubicacion.y, D.ubicacion.size, D.ubicacion.maxW);
}

// ── Sección 2: Tema principal ──────────────────────────────────

function fillTema(page: PDFPage, temas: string[], f: PDFFont): void {
  const T = TEMA;
  const lineas = envolver(f, temas.join(' / '), T.size, T.maxW);
  lineas.slice(0, T.maxLineas).forEach((l, i) => {
    texto(page, f, l, T.x, T.yInicio - i * T.lineH, T.size);
  });
}

// ── Sección 3: Participantes ───────────────────────────────────

async function fillParticipantes(
  doc: PDFDocument,
  page: PDFPage,
  participantes: IDocumentCapacitacionDifusionTrabajadorData[],
  f: PDFFont,
): Promise<void> {
  const P = PARTICIPANTES;
  for (let i = 0; i < participantes.length; i++) {
    const p = participantes[i];
    const y = P.yInicio - i * P.lineH;
    texto(page, f, p.nombre,    P.nombreX,   y - 2, P.size, P.nombreMaxW);
    texto(page, f, p.rut,       P.rutX,      y - 2, P.size, P.rutMaxW);
    texto(page, f, p.cargo,     P.cargoX,    y - 2, P.size, P.cargoMaxW);
    texto(page, f, p.proyecto,  P.proyectoX, y - 2, P.size, P.proyectoMaxW);
    if (p.firma) {
      await dibujarFirma(doc, page, p.firma, P.firmaXc, y, P.firmaMaxW, P.firmaMaxH);
    }
  }
}

// ── Footer ────────────────────────────────────────────────────

async function fillFooter(
  doc: PDFDocument,
  page: PDFPage,
  data: CreateCapacitacionDifusionDataDto,
  relator: IDocumentCapacitacionDifusionRelatorData,
  totalParticipantes: number,
  f: PDFFont,
): Promise<void> {
  const F = FOOTER;
  const fechaStr = formatearFecha(data.fecha);
  const { duracion, hhTotales } = calcularTiempos(data.horaInicio, data.horaTermino, totalParticipantes);

  texto(page, f, String(totalParticipantes), F.numParticipantes.x, F.numParticipantes.y, F.numParticipantes.size);
  texto(page, f, fechaStr,        F.fecha.x,       F.fecha.y,       F.fecha.size);
  texto(page, f, data.horaInicio, F.horaInicio.x,  F.horaInicio.y,  F.horaInicio.size);
  texto(page, f, data.horaTermino,F.horaTermino.x, F.horaTermino.y, F.horaTermino.size);
  texto(page, f, duracion,        F.duracion.x,    F.duracion.y,    F.duracion.size);
  texto(page, f, hhTotales,       F.hhTotales.x,   F.hhTotales.y,   F.hhTotales.size);

  await dibujarFirma(doc, page, relator.firma, F.firmaRelator.xc, F.firmaRelator.y, F.firmaRelator.maxW, F.firmaRelator.maxH);
}

// ── Helpers internos ──────────────────────────────────────────

function formatearFecha(fecha: Date): string {
  const d = new Date(fecha);
  const day   = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function calcularTiempos(
  inicio: string,
  termino: string,
  numParticipantes: number,
): { duracion: string; hhTotales: string } {
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = termino.split(':').map(Number);
  const totalMins = h2 * 60 + m2 - (h1 * 60 + m1);
  const horas = totalMins / 60;
  const duracion =
    totalMins % 60 === 0
      ? `${Math.floor(horas)}h`
      : `${Math.floor(horas)}h ${totalMins % 60}min`;
  const hhTotales = (horas * numParticipantes).toFixed(1);
  return { duracion, hhTotales };
}
