import { PDFDocument, PDFFont, PDFPage, StandardFonts } from 'pdf-lib';
import { PASO1, TRANSVERSALES, RIESGOS, PASO3, PASO4, PASO5 } from './art-pdf.coords';
import {
  texto,
  textoCentrado,
  tick,
  envolver,
  dibujarFirma,
} from '../pdf-draw.utils';
import { CreateArtDtoV2 } from 'src/documents/dtos/art-data-v2.dto';

// ── Entry point ───────────────────────────────────────────────

export async function fillArt(pdfDoc: PDFDocument, art: CreateArtDtoV2): Promise<void> {
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

export function buildArtFileName(art: CreateArtDtoV2, userId: string): string {
  const fecha = String(art.planificacion.fecha ?? 'sin-fecha').replace(/\//g, '-');
  const randomId = new Date().getTime().toString(36).slice(-5);
  return `ART_${userId}_${fecha}_${randomId}.pdf`;
}

// ── PASO 1 ────────────────────────────────────────────────────

function fillPaso1(p: PDFPage, art: CreateArtDtoV2, f: PDFFont): void {
  const c = PASO1;
  const plan = art.planificacion;

  texto(p, f, plan.supervisorAsignador, c.supervisorAsignador.x, c.supervisorAsignador.y, c.supervisorAsignador.size, c.supervisorAsignador.maxW);
  texto(p, f, plan.empresa,             c.empresa.x,             c.empresa.y,             c.empresa.size,             c.empresa.maxW);
  texto(p, f, plan.gerencia,            c.gerencia.x,            c.gerencia.y,            c.gerencia.size,            c.gerencia.maxW);

  const [dia, mes, anio] = String(plan.fecha ?? '').split(/[\/\-]/);
  textoCentrado(p, f, dia  ?? '', c.fechaDia.xc,  c.fechaDia.y,  c.fechaDia.size);
  textoCentrado(p, f, mes  ?? '', c.fechaMes.xc,  c.fechaMes.y,  c.fechaMes.size);
  textoCentrado(p, f, anio ?? '', c.fechaAnio.xc, c.fechaAnio.y, c.fechaAnio.size);

  texto(p, f, plan.horaInicio,       c.horaInicio.x,       c.horaInicio.y,       c.horaInicio.size,       c.horaInicio.maxW);
  texto(p, f, plan.horaTermino,      c.horaTermino.x,      c.horaTermino.y,      c.horaTermino.size,      c.horaTermino.maxW);
  texto(p, f, plan.superintendencia, c.superintendencia.x, c.superintendencia.y, c.superintendencia.size, c.superintendencia.maxW);
  texto(p, f, plan.lugarEspecifico,  c.lugarEspecifico.x,  c.lugarEspecifico.y,  c.lugarEspecifico.size,  c.lugarEspecifico.maxW);
  texto(p, f, plan.trabajoARealizar, c.trabajoARealizar.x, c.trabajoARealizar.y, c.trabajoARealizar.size, c.trabajoARealizar.maxW);
}

// ── Preguntas transversales ───────────────────────────────────

function fillTransversales(p: PDFPage, art: CreateArtDtoV2, f: PDFFont): void {
  const t = TRANSVERSALES;
  const sup  = art.preguntasTransversalesSupervisor;
  const trab = art.preguntasTransversalesTrabajador;

  const camposSup = [
    'supTieneEstandar', 'supPersonalCapacitado', 'supSolicitoPermisos',
    'supVerificoSegregacion', 'supPersonalComunicacion', 'supPersonalEPP',
  ] as const;

  const camposTrab = [
    'trabConoceEstandar', 'trabTieneCompetencias', 'trabTieneAutorizacion',
    'trabSegrego', 'trabConoceEmergencia', 'trabUsaEPP',
  ] as const;

  camposSup.forEach((campo, i) => {
    tick(p, sup[campo] ? t.supervisor.siX : t.supervisor.noX, t.filasY[i], sup[campo]);
  });

  camposTrab.forEach((campo, i) => {
    tick(p, trab[campo] ? t.trabajador.siX : t.trabajador.noX, t.filasY[i], trab[campo]);
  });

  if (sup.supTieneEstandar && sup.supNombreEstandar) {
    texto(p, f, sup.supNombreEstandar, t.supNombreEstandar.x, t.supNombreEstandar.y, t.supNombreEstandar.size, t.supNombreEstandar.maxW);
  }
  if (trab.trabConoceEstandar && trab.trabNombreEstandar) {
    texto(p, f, trab.trabNombreEstandar, t.trabNombreEstandar.x, t.trabNombreEstandar.y, t.trabNombreEstandar.size, t.trabNombreEstandar.maxW);
  }
}

// ── PASO 2: Riesgos críticos ──────────────────────────────────

function fillRiesgosCriticos(p: PDFPage, art: CreateArtDtoV2, f: PDFFont, fb: PDFFont): void {
  const R = RIESGOS;

  const drawSection = (
    riesgos: CreateArtDtoV2['riesgosCriticosSupervisor'],
    sec: typeof R.supervisor | typeof R.trabajador,
  ) => {
    riesgos.slice(0, 6).forEach((r, k) => {
      const bx = R.colsX[k];

      const lineas = envolver(f, r.nombre, sec.nombreL1.size, sec.nombreL1.maxW);
      texto(p, f, lineas[0] ?? '', bx + sec.nombreL1.dx, sec.nombreL1.y, sec.nombreL1.size);
      if (lineas.length > 1) {
        texto(p, f, lineas.slice(1).join(' '), bx + sec.nombreL2.dx, sec.nombreL2.y, sec.nombreL2.size, sec.nombreL2.maxW);
      }
      texto(p, fb, r.codigo, bx + sec.cod.dx, sec.cod.y, sec.cod.size);

      r.controles.slice(0, 10).forEach((ctrl, i) => {
        const y = sec.filasY[i];
        texto(p, f, ctrl.label, bx + R.ctrlDx, y - 2.5, 5.5);
        tick(p, ctrl.aplica ? bx + R.siDx : bx + R.noDx, y, ctrl.aplica);
      });
    });
  };

  drawSection(art.riesgosCriticosSupervisor, R.supervisor);
  drawSection(art.riesgosCriticosTrabajador, R.trabajador);
}

// ── PASO 3: Otros riesgos ─────────────────────────────────────

function fillPaso3(p: PDFPage, art: CreateArtDtoV2, f: PDFFont): void {
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

function fillPaso4(p: PDFPage, art: CreateArtDtoV2, f: PDFFont): void {
  const c = PASO4;
  const ts = art.trabajosSimultaneo;
  if (!ts) return;

  const marca = (v: boolean, si: { xc: number }, no: { xc: number }) => {
    tick(p, v ? si.xc : no.xc, c.tickY, v);
  };

  marca(ts.trabajosSimultaneos, c.existenSi, c.existenNo);

  if (ts.trabajosSimultaneos) {
    marca(ts.coordinacionLider   ?? false, c.coordinacionSi,  c.coordinacionNo);
    marca(ts.verificacionCruzada ?? false, c.verificacionSi,  c.verificacionNo);
    marca(ts.comunicacionAcciones ?? false, c.comunicacionSi, c.comunicacionNo);

    if (ts.contextoSimultaneo) {
      envolver(f, ts.contextoSimultaneo, c.contexto.size, c.contexto.maxW)
        .slice(0, 8)
        .forEach((l, i) => {
          texto(p, f, l, c.contexto.x, c.contexto.y - i * c.contexto.lineH, c.contexto.size);
        });
    }
  }
}

// ── PASO 5: Validación equipo ejecutor ────────────────────────

async function fillPaso5(doc: PDFDocument, p: PDFPage, art: CreateArtDtoV2, f: PDFFont): Promise<void> {
  const c    = PASO5;
  const cond = art.condicionesFisicas;

  texto(p, f, cond.liderNombre, c.nombreX, c.lider.y - 2.5, c.sizeNombre, 168);
  texto(p, f, cond.liderCargo,  c.cargoX,  c.lider.y - 2.5, c.sizeCargo,  78);
  tick(p, cond.liderVerificoCondiciones ? c.siXc : c.noXc, c.lider.y, cond.liderVerificoCondiciones);
  await dibujarFirma(doc, p, cond.liderFirma, c.firmaXc, c.lider.y, c.firmaMaxW, c.lider.firmaH);

  for (let i = 0; i < Math.min(art.participantes.length, c.filasTrabY.length); i++) {
    const par = art.participantes[i];
    const y   = c.filasTrabY[i];

    texto(p, f, par.participanteNombre, c.nombreX, y - 2.5, c.sizeNombre, 168);
    texto(p, f, par.participanteCargo,  c.cargoX,  y - 2.5, c.sizeCargo,  78);
    tick(p, par.participanteEnCondiciones ? c.siXc : c.noXc, y, par.participanteEnCondiciones);
    await dibujarFirma(doc, p, par.participanteFirma, c.firmaXc, y, c.firmaMaxW, c.filaAlto - 3);
  }
}
