import { DOCUMENT_STATUS } from 'src/common/enums/document-status.enum';
import { ArtData } from '../pdf/templates/ART/art-pdf.types';

const PASO1_REQUIRED: (keyof ArtData)[] = [
  'supervisorAsignador',
  'empresa',
  'gerencia',
  'fecha',
  'horaInicio',
  'horaTermino',
  'trabajoARealizar',
];

export function calculateArtStatus(data: Partial<ArtData>): DOCUMENT_STATUS {
  const paso1Ok = PASO1_REQUIRED.every((f) => !!(data as Record<string, unknown>)[f]);
  if (!paso1Ok) return DOCUMENT_STATUS.INCOMPLETO;

  return DOCUMENT_STATUS.PENDIENTE_FIRMAS;
}
