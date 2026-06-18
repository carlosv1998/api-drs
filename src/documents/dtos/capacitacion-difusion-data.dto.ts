import { IsArray, IsDate, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { CAPACITACION_DIFUSION_ASISTENCIA, CAPACITACION_DIFUSION_MODALIDAD, CAPACITACION_DIFUSION_TYPE } from "../enums/capacitacion-difusion.enum";
import { Type } from "class-transformer";
import { IsTime } from "src/common/validators/is-time";
import { IsTimeAfter } from "src/common/validators/is-after-time";

export class CreateCapacitacionDifusionDataDto {
  @IsString()
  codigo: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  revision: number;

  @IsString()
  @IsOptional()
  proyecto?: string = "PRET";

  @IsEnum(CAPACITACION_DIFUSION_TYPE)
  tipoActividad: CAPACITACION_DIFUSION_TYPE;

  @IsEnum(CAPACITACION_DIFUSION_MODALIDAD)
  modalidad: CAPACITACION_DIFUSION_MODALIDAD;

  @IsEnum(CAPACITACION_DIFUSION_ASISTENCIA)
  asistencia: CAPACITACION_DIFUSION_ASISTENCIA;

  @IsMongoId()
  relatorId: string;

  @IsString()
  ubicacion: string;

  @IsString({ each: true })
  @IsArray()
  temaPrincipal: string[];

  @IsMongoId({ each: true })
  @IsArray()
  listaParticipantes: string[];

  @Type(() => Date)
  @IsDate()
  fecha: Date;

  @IsTime()
  horaInicio: string;

  @IsTime()
  @IsTimeAfter('horaInicio')
  horaTermino: string;
}