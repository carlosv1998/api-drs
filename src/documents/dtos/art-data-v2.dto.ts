import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsDefined, IsNumber, IsObject, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";

export class ArtControlDto {
  @IsString() label: string;
  @IsBoolean() aplica: boolean;
}

export class ArtRiesgoCriticoDto {
  @IsNumber() rcNum: number;
  @IsString() nombre: string;
  @IsString() codigo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtControlDto)
  controles: ArtControlDto[];
}

export class ArtOtroRiesgoDto {
  @IsString() riesgo: string;
  @IsString() medidaControl: string;
}

export class ArtTrabajosSimultaneoDto {
  @IsBoolean()
  trabajosSimultaneos: boolean;

  @ValidateIf((o) => o.trabajosSimultaneos)
  @IsString()
  contextoSimultaneo: string;

  @ValidateIf((o) => o.trabajosSimultaneos)
  @IsBoolean()
  coordinacionLider: boolean;

  @ValidateIf((o) => o.trabajosSimultaneos)
  @IsBoolean()
  verificacionCruzada: boolean;

  @ValidateIf((o) => o.trabajosSimultaneos)
  @IsBoolean()
  comunicacionAcciones: boolean;
}

export class ArtCondicionesFisicasDto {
  @IsString() liderNombre: string;
  @IsString() liderCargo: string;
  @IsBoolean() liderVerificoCondiciones: boolean;
  @IsString() liderFirma: string;
}

export class ArtParticipanteDto {
  @IsString() participanteNombre: string;
  @IsString() participanteCargo: string;
  @IsBoolean() participanteEnCondiciones: boolean;
  @IsString() participanteFirma: string;
}

export class ArtPlanificacionDto {
  @IsString() supervisorAsignador: string;
  @IsString() empresa: string;
  @IsString() gerencia: string;
  @IsString() superintendencia: string;
  @IsString() lugarEspecifico: string;
  @IsString() trabajoARealizar: string;
  @IsString() fecha: string;
  @IsString() horaInicio: string;
  @IsString() horaTermino: string;
}

export class ArtPreguntasTransversalesDto {
  @IsBoolean() supTieneEstandar: boolean;

  @ValidateIf((o) => o.supTieneEstandar)
  @IsString() supNombreEstandar: string;
  
  @IsBoolean() supPersonalCapacitado: boolean;
  @IsBoolean() supSolicitoPermisos: boolean;
  @IsBoolean() supVerificoSegregacion: boolean;
  @IsBoolean() supPersonalComunicacion: boolean;
  @IsBoolean() supPersonalEPP: boolean;
}

export class ArtPreguntasTransversalesTrabajadorDto {
  @IsBoolean() trabConoceEstandar: boolean;

  @ValidateIf((o) => o.trabConoceEstandar)
  @IsString() trabNombreEstandar: string;

  @IsBoolean() trabTieneCompetencias: boolean;
  @IsBoolean() trabTieneAutorizacion: boolean;
  @IsBoolean() trabSegrego: boolean;
  @IsBoolean() trabConoceEmergencia: boolean;
  @IsBoolean() trabUsaEPP: boolean;
}

export class CreateArtDtoV2 {
  // PLANIFICACIÓN DEL TRABAJO A REALIZAR
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ArtPlanificacionDto)
  planificacion: ArtPlanificacionDto;

  // RIESGOS Y CONTROLES CRÍTICOS
  // SUPERVISOR
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ArtPreguntasTransversalesDto)
  preguntasTransversalesSupervisor: ArtPreguntasTransversalesDto;

  // TRABAJADOR
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ArtPreguntasTransversalesTrabajadorDto)
  preguntasTransversalesTrabajador: ArtPreguntasTransversalesTrabajadorDto;
  
  // RIESGOS CRÍTICOS ESPECÍFICOS DEL TRABAJO
  // SUPERVISOR
  @Transform(({ value }) => value ?? [])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtRiesgoCriticoDto)
  riesgosCriticosSupervisor: ArtRiesgoCriticoDto[];

  // TRABAJADOR
  @Transform(({ value }) => value ?? [])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtRiesgoCriticoDto)
  riesgosCriticosTrabajador: ArtRiesgoCriticoDto[];

  // OTROS RIESGOS
  @Transform(({ value }) => value ?? [])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtOtroRiesgoDto)
  otrosRiesgos: ArtOtroRiesgoDto[];

  // TRABAJOS EN SIMULTÁNEO
  @ValidateNested()
  @Type(() => ArtTrabajosSimultaneoDto)
  @IsOptional()
  trabajosSimultaneo?: ArtTrabajosSimultaneoDto;

  // CONDICIONES FÍSICAS Y PSICOLÓGICAS PARA REALIZAR EL TRABAJO / VALIDACIÓN ART POR EQUIPO EJECUTOR
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ArtCondicionesFisicasDto)
  condicionesFisicas: ArtCondicionesFisicasDto;

  @Transform(({ value }) => value ?? [])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArtParticipanteDto)
  participantes: ArtParticipanteDto[];
}
