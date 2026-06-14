import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

type SiNo = 'si' | 'no';
const SINO = ['si', 'no'] as const;

export class ArtControlDto {
  @IsString() label: string;
  @IsIn(SINO) aplica: SiNo;
}

export class ArtRiesgoCriticoDto {
  @IsNumber() rcNum: number;
  @IsBoolean() seleccionado: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtControlDto)
  controles: ArtControlDto[];
}

export class ArtOtroRiesgoDto {
  @IsString() @IsOptional() riesgo?: string;
  @IsString() @IsOptional() medidaControl?: string;
}

export class ArtParticipanteDto {
  @IsString() @IsOptional() nombre?: string;
  @IsString() @IsOptional() cargo?: string;
  @IsIn(SINO) @IsOptional() enCondiciones?: SiNo;
  @IsString() @IsOptional() firma?: string;
}

export class ArtDataDto {
  // ── PASO 1 ─────────────────────────────────────────────────
  @IsString() @IsOptional() supervisorAsignador?: string;
  @IsString() @IsOptional() empresa?: string;
  @IsString() @IsOptional() gerencia?: string;
  @IsString() @IsOptional() superintendencia?: string;
  @IsString() @IsOptional() lugarEspecifico?: string;
  @IsString() @IsOptional() trabajoARealizar?: string;
  @IsString() @IsOptional() fecha?: string;
  @IsString() @IsOptional() horaInicio?: string;
  @IsString() @IsOptional() horaTermino?: string;
  @IsNumber() @IsOptional() numeroDia?: number;

  // ── Transversales supervisor ────────────────────────────────
  @IsIn(SINO) @IsOptional() supTieneEstandar?: SiNo;
  @IsString() @IsOptional() supNombreEstandar?: string;
  @IsIn(SINO) @IsOptional() supPersonalCapacitado?: SiNo;
  @IsIn(SINO) @IsOptional() supSolicitoPermisos?: SiNo;
  @IsIn(SINO) @IsOptional() supVerificoSegregacion?: SiNo;
  @IsIn(SINO) @IsOptional() supPersonalComunicacion?: SiNo;
  @IsIn(SINO) @IsOptional() supPersonalEPP?: SiNo;

  // ── Transversales trabajador ────────────────────────────────
  @IsIn(SINO) @IsOptional() trabConoceEstandar?: SiNo;
  @IsString() @IsOptional() trabNombreEstandar?: string;
  @IsIn(SINO) @IsOptional() trabTieneCompetencias?: SiNo;
  @IsIn(SINO) @IsOptional() trabTieneAutorizacion?: SiNo;
  @IsIn(SINO) @IsOptional() trabSegrego?: SiNo;
  @IsIn(SINO) @IsOptional() trabConoceEmergencia?: SiNo;
  @IsIn(SINO) @IsOptional() trabUsaEPP?: SiNo;

  // ── PASO 2 ─────────────────────────────────────────────────
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtRiesgoCriticoDto)
  @IsOptional()
  riesgosCriticos?: ArtRiesgoCriticoDto[];

  // ── PASO 3 ─────────────────────────────────────────────────
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtOtroRiesgoDto)
  @IsOptional()
  otrosRiesgos?: ArtOtroRiesgoDto[];

  // ── PASO 4 ─────────────────────────────────────────────────
  @IsIn(SINO) @IsOptional() trabajosSimultaneos?: SiNo;
  @IsString() @IsOptional() contextoSimultaneo?: string;
  @IsIn(SINO) @IsOptional() coordinacionLider?: SiNo;
  @IsIn(SINO) @IsOptional() verificacionCruzada?: SiNo;
  @IsIn(SINO) @IsOptional() comunicacionAcciones?: SiNo;

  // ── PASO 5 ─────────────────────────────────────────────────
  @IsString() @IsOptional() liderNombre?: string;
  @IsString() @IsOptional() liderCargo?: string;
  @IsIn(SINO) @IsOptional() liderVerificoCondiciones?: SiNo;
  @IsString() @IsOptional() liderFirma?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtParticipanteDto)
  @IsOptional()
  participantes?: ArtParticipanteDto[];
}
