// ─────────────────────────────────────────────────────────────
// Coordenadas calibradas del formato ART oficial (Codelco, carta 612x792)
// Origen (0,0) = esquina INFERIOR izquierda. Unidad: puntos PDF.
// ─────────────────────────────────────────────────────────────

export const COLORES = {
  teal: { r: 0 / 255, g: 155 / 255, b: 158 / 255 },
  rojo: { r: 204 / 255, g: 18 / 255, b: 18 / 255 },
  negro: { r: 0, g: 0, b: 0 },
};

// ── PÁGINA 1 ─────────────────────────────────────────────────

export const PASO1 = {
  supervisorAsignador: { x: 106, y: 690, size: 8, maxW: 238 },
  empresa:             { x: 396, y: 690, size: 8, maxW: 184 },
  gerencia:            { x: 106, y: 670, size: 7, maxW: 117 },
  fechaDia:            { xc: 280, y: 670, size: 8 },
  fechaMes:            { xc: 302, y: 670, size: 8 },
  fechaAnio:           { xc: 329, y: 670, size: 8 },
  horaInicio:          { x: 396, y: 670, size: 8, maxW: 67 },
  horaTermino:         { x: 518, y: 670, size: 8, maxW: 62 },
  superintendencia:    { x: 106, y: 650, size: 7, maxW: 117 },
  lugarEspecifico:     { x: 276, y: 650, size: 7, maxW: 304 },
  trabajoARealizar:    { x: 106, y: 630, size: 7, maxW: 474 },
};

// Preguntas transversales: 6 filas, ticks centrados en celdas SI/NO
export const TRANSVERSALES = {
  filasY: [525.6, 499.4, 475.8, 452.2, 428.5, 404.5],
  supervisor: { siX: 276,   noX: 293.5 },
  trabajador: { siX: 557,   noX: 574.5 },
  supNombreEstandar:  { x: 106, y: 515, size: 6, maxW: 158 },
  trabNombreEstandar: { x: 393, y: 515, size: 6, maxW: 150 },
};

// Riesgos críticos: 6 columnas x 2 secciones (supervisor / trabajador)
export const RIESGOS = {
  colsX: [58.6, 147.4, 236.2, 325.4, 414.2, 503.0],
  anchoBloque: 80.6,
  supervisor: {
    nombreL1: { dx: 25.5, y: 349, size: 5, maxW: 53 },
    nombreL2: { dx: 2,    y: 342.5, size: 5, maxW: 77 },
    cod:      { dx: 20,   y: 331.5, size: 6 },
    filasY: [322.0, 309.6, 298.3, 287.1, 275.8, 264.5, 253.2, 242.0, 230.7, 219.4],
  },
  trabajador: {
    nombreL1: { dx: 25.5, y: 199, size: 5, maxW: 53 },
    nombreL2: { dx: 2,    y: 192.5, size: 5, maxW: 77 },
    cod:      { dx: 20,   y: 181.5, size: 6 },
    filasY: [172.1, 160.1, 148.8, 137.5, 126.3, 115.0, 103.7, 92.4, 81.2, 69.6],
  },
  ctrlDx: 17,
  siDx: 51.5,
  noDx: 71.5,
};

// ── PÁGINA 2 ─────────────────────────────────────────────────

export const PASO3 = {
  filasY: [677.3, 660.2, 643.2, 626.2, 609.2, 592.1, 575.3],
  riesgoX: 33,
  medidaX: 230,
  size: 7,
  maxWRiesgo: 188,
  maxWMedida: 348,
};

export const PASO4 = {
  tickY: 443,
  existenSi:      { xc: 46.3 },
  existenNo:      { xc: 82.3 },
  contexto:       { x: 105, y: 465, size: 6.5, maxW: 190, lineH: 9 },
  coordinacionSi: { xc: 324.7 },
  coordinacionNo: { xc: 375.1 },
  verificacionSi: { xc: 421.0 },
  verificacionNo: { xc: 462.0 },
  comunicacionSi: { xc: 507.6 },
  comunicacionNo: { xc: 558.0 },
};

export const PASO5 = {
  nombreX: 98,
  cargoX: 275,
  siXc: 387.3,
  noXc: 450.7,
  firmaXc: 532.8,
  firmaMaxW: 92,
  lider: { y: 270, firmaH: 15 },
  filasTrabY: [205.5, 188.4, 171.4, 154.3, 137.5,
               120.5, 103.4, 86.4, 69.4, 52.4],
  filaAlto: 17.3,
  sizeNombre: 7.5,
  sizeCargo: 7,
};
