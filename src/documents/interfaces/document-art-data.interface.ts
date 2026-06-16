export interface IArtControl {
  label: string;
  aplica: boolean;
}

export interface IArtRiesgoCritico {
  rcNum: number;
  nombre: string;
  codigo: string;
  controles: IArtControl[];
}

export interface IArtOtroRiesgo {
  riesgo: string;
  medidaControl: string;
}

export interface IArtTrabajosSimultaneo {
  trabajosSimultaneos: boolean;
  contextoSimultaneo?: string;
  coordinacionLider?: boolean;
  verificacionCruzada?: boolean;
  comunicacionAcciones?: boolean;
}

export interface IArtCondicionesFisicas {
  liderNombre: string;
  liderCargo: string;
  liderVerificoCondiciones: boolean;
  liderFirma: boolean;
}

export interface IArtParticipante {
  participanteNombre: string;
  participanteCargo: string;
  participanteEnCondiciones: boolean;
  participanteFirma: boolean;
}

export interface IArtPlanificacion {
  supervisorAsignador: string;
  empresa: string;
  gerencia: string;
  superintendencia: string;
  lugarEspecifico: string;
  trabajoARealizar: string;
  fecha: string;
  horaInicio: string;
  horaTermino: string;
}

export interface IArtPreguntasTransversalesSupervisor {
  supTieneEstandar: boolean;
  supNombreEstandar?: string;
  supPersonalCapacitado: boolean;
  supSolicitoPermisos: boolean;
  supVerificoSegregacion: boolean;
  supPersonalComunicacion: boolean;
  supPersonalEPP: boolean;
}

export interface IArtPreguntasTransversalesTrabajador {
  trabConoceEstandar: boolean;
  trabNombreEstandar?: string;
  trabTieneCompetencias: boolean;
  trabTieneAutorizacion: boolean;
  trabSegrego: boolean;
  trabConoceEmergencia: boolean;
  trabUsaEPP: boolean;
}

export interface IDocumentArtData {
  planificacion: IArtPlanificacion;
  preguntasTransversalesSupervisor: IArtPreguntasTransversalesSupervisor;
  preguntasTransversalesTrabajador: IArtPreguntasTransversalesTrabajador;
  riesgosCriticosSupervisor: IArtRiesgoCritico[];
  riesgosCriticosTrabajador: IArtRiesgoCritico[];
  otrosRiesgos: IArtOtroRiesgo[];
  trabajosSimultaneo?: IArtTrabajosSimultaneo;
  condicionesFisicas: IArtCondicionesFisicas;
  participantes: IArtParticipante[];
}
