import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

/**
 * Limpia un RUT chileno removiendo puntos, guiones y espacios
 * @param rut RUT a limpiar
 * @returns RUT limpio
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toUpperCase();
}

/**
 * Calcula el dígito verificador de un RUT chileno
 * @param rut RUT sin dígito verificador
 * @returns Dígito verificador calculado
 */
export function calculateVerifierDigit(rut: string): string {
  let sum = 0;
  let multiplier = 2;

  // Recorrer el RUT de derecha a izquierda
  for (let i = rut.length - 1; i >= 0; i--) {
    sum += parseInt(rut[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const verifier = 11 - remainder;

  if (verifier === 11) return '0';
  if (verifier === 10) return 'K';
  return verifier.toString();
}

/**
 * Formatea un RUT chileno con guión (sin puntos)
 * @param rut RUT limpio (sin puntos ni guiones)
 * @returns RUT formateado (ej: 12345678-9) o null si es inválido
 */
export function formatChileanRut(rut: string): string | null {
  // Limpiar el RUT primero
  const cleanedRut = cleanRut(rut);

  // Validar que sea válido antes de formatear
  if (!validateChileanRut(cleanedRut)) {
    return null;
  }

  // Separar el cuerpo y el dígito verificador
  const body = cleanedRut.slice(0, -1);
  const verifier = cleanedRut.slice(-1);

  // Retornar con el formato: solo guión, sin puntos
  return `${body}-${verifier}`;
}

/**
 * Valida si un RUT chileno es válido
 * @param rut RUT a validar (puede contener puntos y guiones)
 * @returns true si el RUT es válido, false en caso contrario
 */
export function validateChileanRut(rut: string | null | undefined): boolean {
  // Validar que no sea nulo o undefined
  if (!rut) {
    return false;
  }

  // Validar que sea un string
  if (typeof rut !== 'string') {
    return false;
  }

  // Limpiar el RUT
  const cleanedRut = cleanRut(rut);

  // Validar longitud mínima (1 dígito + verificador) y máxima (8 dígitos + verificador)
  // Los RUTs chilenos pueden ser tan cortos como 1-9 (2 caracteres)
  if (cleanedRut.length < 2 || cleanedRut.length > 9) {
    return false;
  }

  // Separar el cuerpo del RUT y el dígito verificador
  const body = cleanedRut.slice(0, -1);
  const verifier = cleanedRut.slice(-1);

  // Validar que el cuerpo solo contenga números
  if (!/^\d+$/.test(body)) {
    return false;
  }

  // Validar que el dígito verificador sea válido
  if (!/^[0-9K]$/.test(verifier)) {
    return false;
  }

  // Calcular el dígito verificador esperado
  const expectedVerifier = calculateVerifierDigit(body);

  // Comparar el dígito verificador
  return verifier === expectedVerifier;
}

/**
 * Decorador de validación para RUTs chilenos
 * @param validationOptions Opciones de validación
 * @returns Decorador
 */
export function IsChileanRut(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isChileanRut',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return validateChileanRut(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Chilean RUT`;
        },
      },
    });
  };
}

/**
 * Decorador Transform que limpia y normaliza un RUT chileno
 * Convierte el RUT al formato con guión sin puntos (ej: 123456789 -> 12345678-9)
 */
export function CleanChileanRut() {
  return Transform(({ value, key }) => {
    // Si es null o undefined, retornar tal cual
    if (value === null || value === undefined) {
      return value;
    }

    // Si no es string, lanzar error
    if (typeof value !== 'string') {
      throw new BadRequestException(`${key} must be a string`);
    }

    // Formatear el RUT con puntos y guión
    const formatted = formatChileanRut(value);

    if (!formatted) {
      throw new BadRequestException(`${key} must be a valid Chilean RUT`);
    }

    return formatted;
  });
}
