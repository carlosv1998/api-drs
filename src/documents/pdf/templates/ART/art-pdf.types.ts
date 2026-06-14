export type SiNo = 'si' | 'no';

export interface ArtControl {
  label: string;
  aplica: SiNo;
}

export interface ArtRiesgoCritico {
  rcNum: number;
  seleccionado: boolean;
  controles: ArtControl[];
}

export interface ArtOtroRiesgo {
  riesgo: string;
  medidaControl: string;
}

export interface ArtParticipante {
  nombre: string;
  cargo: string;
  enCondiciones: SiNo;
  firma?: string;
}

export interface ArtData {
  // ── PASO 1: Planificación ──────────────────────────────────
  supervisorAsignador: string;
  empresa: string;
  gerencia: string;
  superintendencia: string;
  lugarEspecifico: string;
  trabajoARealizar: string;
  fecha: string; // 'DD/MM/YYYY'
  horaInicio: string;
  horaTermino: string;
  numeroDia?: number;

  // ── Transversales supervisor ───────────────────────────────
  supTieneEstandar: SiNo;
  supNombreEstandar?: string;
  supPersonalCapacitado: SiNo;
  supSolicitoPermisos: SiNo;
  supVerificoSegregacion: SiNo;
  supPersonalComunicacion: SiNo;
  supPersonalEPP: SiNo;

  // ── Transversales trabajador ───────────────────────────────
  trabConoceEstandar: SiNo;
  trabNombreEstandar?: string;
  trabTieneCompetencias: SiNo;
  trabTieneAutorizacion: SiNo;
  trabSegrego: SiNo;
  trabConoceEmergencia: SiNo;
  trabUsaEPP: SiNo;

  // ── PASO 2: Riesgos críticos ───────────────────────────────
  riesgosCriticos: ArtRiesgoCritico[];

  // ── PASO 3: Otros riesgos ──────────────────────────────────
  otrosRiesgos: ArtOtroRiesgo[];

  // ── PASO 4: Trabajos en simultáneo ────────────────────────
  trabajosSimultaneos: SiNo;
  contextoSimultaneo?: string;
  coordinacionLider: SiNo;
  verificacionCruzada: SiNo;
  comunicacionAcciones: SiNo;

  // ── PASO 5: Validación equipo ejecutor ────────────────────
  liderNombre: string;
  liderCargo: string;
  liderVerificoCondiciones: SiNo;
  liderFirma?: string; // base64 dataUrl
  participantes: ArtParticipante[];
}
