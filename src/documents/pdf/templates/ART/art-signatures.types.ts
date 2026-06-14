export interface ArtSignerParticipant {
  userId: string;
  nombre: string;
  cargo: string;
  enCondiciones: 'si' | 'no' | null;
  hasSigned: boolean;
  signedAt: string | null;
  signatureUrl: string | null;
}

export interface ArtSignerLider {
  userId: string;
  nombre: string;
  cargo: string;
  verificoCondiciones: 'si' | 'no' | null;
  hasSigned: boolean;
  signedAt: string | null;
  signatureUrl: string | null;
}

export interface ArtSignatures {
  lider: ArtSignerLider | null;
  participantes: ArtSignerParticipant[];
}
