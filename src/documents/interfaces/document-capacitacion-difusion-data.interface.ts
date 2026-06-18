import { CAPACITACION_DIFUSION_ASISTENCIA, CAPACITACION_DIFUSION_MODALIDAD, CAPACITACION_DIFUSION_TYPE } from "../enums/capacitacion-difusion.enum";

export interface IDocumentCapacitacionDifusionData {
  codigo: string;
  revision: number;
  tipoActividad: CAPACITACION_DIFUSION_TYPE;
  modalidad: CAPACITACION_DIFUSION_MODALIDAD;
  asistencia: CAPACITACION_DIFUSION_ASISTENCIA;
  relatorId: string;
  ubicacion: string;
  temaPrincipal: string[];
  listaParticipantes: string[];
  fecha: Date;
  horaInicio: string;
  horaTermino: string;

  createdAt: string;
  updatedAt: string;
}

export interface IDocumentCapacitacionDifusionRelatorData {
  nombre: string;
  rut: string;
  cargo: string;
  firma: string;
}

export interface IDocumentCapacitacionDifusionTrabajadorData {
  nombre: string;
  rut: string;
  cargo: string;
  proyecto: string;
  firma?: string;
}