import { PDFDocument, PDFFont, PDFPage, StandardFonts } from 'pdf-lib';
import { PASO1, TRANSVERSALES, RIESGOS, PASO3, PASO4, PASO5 } from './art-pdf.coords';
import { RIESGOS_CODELCO } from '../../constants/riesgos-codelco.constant';
import { ArtData, SiNo } from './art-pdf.types';
import {
  texto,
  textoCentrado,
  tick,
  envolver,
  dibujarFirma,
} from '../pdf-draw.utils';

// ── Entry point ───────────────────────────────────────────────

export async function fillArt(pdfDoc: PDFDocument, art: ArtData): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const [pag1, pag2] = pdfDoc.getPages();

  fillPaso1(pag1, art, font);
  fillTransversales(pag1, art, font);
  fillRiesgosCriticos(pag1, art, font, fontBold);
  fillPaso3(pag2, art, font);
  fillPaso4(pag2, art, font);
  await fillPaso5(pdfDoc, pag2, art, font);
}

export function buildArtFileName(art: ArtData, userId: string): string {
  const fecha = String(art.fecha ?? 'sin-fecha').replace(/\//g, '-');
  const num = String(art.numeroDia ?? 1).padStart(3, '0');
  return `ART_${userId}_${fecha}_${num}.pdf`;
}

// ── PASO 1 ────────────────────────────────────────────────────

function fillPaso1(p: PDFPage, art: ArtData, f: PDFFont): void {
  const c = PASO1;
  texto(p, f, art.supervisorAsignador, c.supervisorAsignador.x, c.supervisorAsignador.y, c.supervisorAsignador.size, c.supervisorAsignador.maxW);
  texto(p, f, art.empresa,             c.empresa.x,             c.empresa.y,             c.empresa.size,             c.empresa.maxW);
  texto(p, f, art.gerencia,            c.gerencia.x,            c.gerencia.y,            c.gerencia.size,            c.gerencia.maxW);

  const [dia, mes, anio] = String(art.fecha ?? '').split(/[\/\-]/);
  textoCentrado(p, f, dia  ?? '', c.fechaDia.xc,  c.fechaDia.y,  c.fechaDia.size);
  textoCentrado(p, f, mes  ?? '', c.fechaMes.xc,  c.fechaMes.y,  c.fechaMes.size);
  textoCentrado(p, f, anio ?? '', c.fechaAnio.xc, c.fechaAnio.y, c.fechaAnio.size);

  texto(p, f, art.horaInicio,       c.horaInicio.x,       c.horaInicio.y,       c.horaInicio.size,       c.horaInicio.maxW);
  texto(p, f, art.horaTermino,      c.horaTermino.x,      c.horaTermino.y,      c.horaTermino.size,      c.horaTermino.maxW);
  texto(p, f, art.superintendencia, c.superintendencia.x, c.superintendencia.y, c.superintendencia.size, c.superintendencia.maxW);
  texto(p, f, art.lugarEspecifico,  c.lugarEspecifico.x,  c.lugarEspecifico.y,  c.lugarEspecifico.size,  c.lugarEspecifico.maxW);
  texto(p, f, art.trabajoARealizar, c.trabajoARealizar.x, c.trabajoARealizar.y, c.trabajoARealizar.size, c.trabajoARealizar.maxW);
}

// ── Preguntas transversales ───────────────────────────────────

function fillTransversales(p: PDFPage, art: ArtData, f: PDFFont): void {
  const t = TRANSVERSALES;

  const camposSup: (keyof ArtData)[] = [
    'supTieneEstandar', 'supPersonalCapacitado', 'supSolicitoPermisos',
    'supVerificoSegregacion', 'supPersonalComunicacion', 'supPersonalEPP',
  ];
  const camposTrab: (keyof ArtData)[] = [
    'trabConoceEstandar', 'trabTieneCompetencias', 'trabTieneAutorizacion',
    'trabSegrego', 'trabConoceEmergencia', 'trabUsaEPP',
  ];

  camposSup.forEach((campo, i) => {
    const v = art[campo] as SiNo;
    if (v === 'si') tick(p, t.supervisor.siX, t.filasY[i], true);
    else if (v === 'no') tick(p, t.supervisor.noX, t.filasY[i], false);
  });

  camposTrab.forEach((campo, i) => {
    const v = art[campo] as SiNo;
    if (v === 'si') tick(p, t.trabajador.siX, t.filasY[i], true);
    else if (v === 'no') tick(p, t.trabajador.noX, t.filasY[i], false);
  });

  if (art.supTieneEstandar === 'si' && art.supNombreEstandar) {
    texto(p, f, art.supNombreEstandar, t.supNombreEstandar.x, t.supNombreEstandar.y, t.supNombreEstandar.size, t.supNombreEstandar.maxW);
  }
  if (art.trabConoceEstandar === 'si' && art.trabNombreEstandar) {
    texto(p, f, art.trabNombreEstandar, t.trabNombreEstandar.x, t.trabNombreEstandar.y, t.trabNombreEstandar.size, t.trabNombreEstandar.maxW);
  }
}

// ── PASO 2: Riesgos críticos ──────────────────────────────────

function fillRiesgosCriticos(p: PDFPage, art: ArtData, f: PDFFont, fb: PDFFont): void {
  const R = RIESGOS;

  const drawSection = (
    riesgos: ArtData['riesgosCriticos'],
    sec: typeof R.supervisor | typeof R.trabajador,
  ) => {
    (riesgos ?? []).filter((r) => r.seleccionado).slice(0, 6).forEach((r, k) => {
      const bx = R.colsX[k];
      const codigo = `RF-${String(r.rcNum).padStart(2, '0')}`;
      const info = RIESGOS_CODELCO.find((x) => x.codigo === codigo);
      const nombre = info?.nombre ?? '';

      const lineas = envolver(f, nombre, sec.nombreL1.size, sec.nombreL1.maxW);
      texto(p, f, lineas[0] ?? '', bx + sec.nombreL1.dx, sec.nombreL1.y, sec.nombreL1.size);
      if (lineas.length > 1) {
        texto(p, f, lineas.slice(1).join(' '), bx + sec.nombreL2.dx, sec.nombreL2.y, sec.nombreL2.size, sec.nombreL2.maxW);
      }
      texto(p, fb, codigo, bx + sec.cod.dx, sec.cod.y, sec.cod.size);

      r.controles.slice(0, 10).forEach((ctrl, i) => {
        const y = sec.filasY[i];
        texto(p, f, ctrl.label, bx + R.ctrlDx, y - 2.5, 5.5);
        if (ctrl.aplica === 'si') tick(p, bx + R.siDx, y, true);
        else if (ctrl.aplica === 'no') tick(p, bx + R.noDx, y, false);
      });
    });
  };

  drawSection(art.riesgosCriticos, R.supervisor);
  drawSection(art.riesgosCriticosTrabajador, R.trabajador);
}

// ── PASO 3: Otros riesgos ─────────────────────────────────────

function fillPaso3(p: PDFPage, art: ArtData, f: PDFFont): void {
  const c = PASO3;
  art.otrosRiesgos
    .filter((r) => r.riesgo || r.medidaControl)
    .slice(0, c.filasY.length)
    .forEach((r, i) => {
      texto(p, f, r.riesgo,        c.riesgoX, c.filasY[i] - 2, c.size, c.maxWRiesgo);
      texto(p, f, r.medidaControl, c.medidaX, c.filasY[i] - 2, c.size, c.maxWMedida);
    });
}

// ── PASO 4: Trabajos en simultáneo ───────────────────────────

function fillPaso4(p: PDFPage, art: ArtData, f: PDFFont): void {
  const c = PASO4;

  const marca = (v: SiNo, si: { xc: number }, no: { xc: number }) => {
    if (v === 'si') tick(p, si.xc, c.tickY, true);
    else if (v === 'no') tick(p, no.xc, c.tickY, false);
  };

  marca(art.trabajosSimultaneos, c.existenSi,      c.existenNo);
  marca(art.coordinacionLider,   c.coordinacionSi,  c.coordinacionNo);
  marca(art.verificacionCruzada, c.verificacionSi,  c.verificacionNo);
  marca(art.comunicacionAcciones,c.comunicacionSi,  c.comunicacionNo);

  if (art.contextoSimultaneo) {
    envolver(f, art.contextoSimultaneo, c.contexto.size, c.contexto.maxW)
      .slice(0, 8)
      .forEach((l, i) => {
        texto(p, f, l, c.contexto.x, c.contexto.y - i * c.contexto.lineH, c.contexto.size);
      });
  }
}

// ── PASO 5: Validación equipo ejecutor ────────────────────────

async function fillPaso5(doc: PDFDocument, p: PDFPage, art: ArtData, f: PDFFont): Promise<void> {
  const c = PASO5;

  texto(p, f, art.liderNombre, c.nombreX, c.lider.y - 2.5, c.sizeNombre, 168);
  texto(p, f, art.liderCargo,  c.cargoX,  c.lider.y - 2.5, c.sizeCargo,  78);
  if (art.liderVerificoCondiciones === 'si') tick(p, c.siXc, c.lider.y, true);
  else if (art.liderVerificoCondiciones === 'no') tick(p, c.noXc, c.lider.y, false);
  await dibujarFirma(doc, p, art.liderFirma, c.firmaXc, c.lider.y, c.firmaMaxW, c.lider.firmaH);

  for (let i = 0; i < Math.min(art.participantes.length, c.filasTrabY.length); i++) {
    const participante = art.participantes[i];
    const y = c.filasTrabY[i];

    texto(p, f, participante.nombre, c.nombreX, y - 2.5, c.sizeNombre, 168);
    texto(p, f, participante.cargo,  c.cargoX,  y - 2.5, c.sizeCargo,  78);
    if (participante.enCondiciones === 'si') tick(p, c.siXc, y, true);
    else if (participante.enCondiciones === 'no') tick(p, c.noXc, y, false);
    await dibujarFirma(doc, p, participante.firma, c.firmaXc, y, c.firmaMaxW, c.filaAlto - 3);
  }
}
