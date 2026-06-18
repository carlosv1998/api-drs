// ─────────────────────────────────────────────────────────────
// Coordenadas calibradas — Difusión DRS/FDA (Letter 612x792 pts)
// Origen (0,0) = esquina INFERIOR izquierda.
// Los valores Y se obtienen con: Y_pdflib = 792 − Y_herramienta
// ─────────────────────────────────────────────────────────────

export const DATOS = {
  tipoActividad: {
    charlaSeg:    { xc: 173, y: 681 },
    capacitacion: { xc: 280, y: 681 },
    reflexion:    { xc: 355, y: 681 },
    reunion:      { xc: 413, y: 681 },
  },
  modalidad: {
    interna: { xc: 173, y: 659 },
    externa: { xc: 220, y: 659 },
  },
  asistencia: {
    presencial: { xc: 373, y: 659 },
    elearning:  { xc: 430, y: 659 },
  },
  relator:   { x: 170, y: 639, size: 8, maxW: 170 },
  rut:       { x: 369, y: 639, size: 8, maxW: 170 },
  cargo:     { x: 170, y: 621, size: 8, maxW: 170 },
  ubicacion: { x: 369, y: 621, size: 8, maxW: 148 },
};

// Tema principal: líneas de texto libre
export const TEMA = {
  x: 83, yInicio: 588, size: 8, lineH: 13, maxW: 548, maxLineas: 10,
};

// Lista de participantes: 15 filas por página
export const PARTICIPANTES = {
  yInicio:    422,
  lineH:      17.3,
  numX:       40,
  nombreX:    97,  nombreMaxW:   128,
  rutX:      213,  rutMaxW:       82,
  cargoX:    277,  cargoMaxW:     82,
  proyectoX: 350,  proyectoMaxW:  96,
  firmaXc:   455,  firmaMaxW:     84,  firmaMaxH: 16,
  size: 7,
};

// Footer
export const FOOTER = {
  numParticipantes: { x: 166, y: 165, size: 8 },
  fecha:            { x: 310, y: 165, size: 8 },
  horaInicio:       { x: 166, y: 145, size: 8 },
  horaTermino:      { x: 310, y: 145, size: 8 },
  duracion:         { x: 166, y: 128, size: 8 },
  hhTotales:        { x: 310, y: 128, size: 8 },
  firmaRelator:     { xc: 455, y: 148, maxW: 120, maxH: 45 },
};
