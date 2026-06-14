export enum DOCUMENT_STATUS {
  CREADO = 'CREADO',               // subida genérica sin workflow
  INCOMPLETO = 'INCOMPLETO',       // datos del formulario incompletos
  PENDIENTE_FIRMAS = 'PENDIENTE_FIRMAS',   // esperando firmas de participantes
  PENDIENTE_LIDER = 'PENDIENTE_LIDER',     // participantes OK, esperando al líder
  COMPLETADO = 'COMPLETADO',       // líder firmó, documento cerrado
}
