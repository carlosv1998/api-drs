import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

/**
 * Limpia un número de teléfono chileno removiendo espacios, guiones, paréntesis y el código de país
 * @param phone Número de teléfono a limpiar
 * @returns Número de teléfono limpio
 */
export function cleanChileanPhone(phone: string): string {
  // Remover espacios, guiones, paréntesis y el signo +
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

  // Si empieza con 56 (código de país de Chile), removerlo
  if (cleaned.startsWith('56') && cleaned.length > 9) {
    cleaned = cleaned.substring(2);
  }

  return cleaned;
}

/**
 * Valida si un número de teléfono chileno es válido
 * Acepta teléfonos móviles (9 dígitos comenzando con 9) y fijos (9 dígitos)
 * @param phone Número de teléfono a validar
 * @returns true si el teléfono es válido, false en caso contrario
 */
export function validateChileanPhone(
  phone: string | null | undefined,
): boolean {
  // Validar que no sea nulo o undefined
  if (!phone) {
    return false;
  }

  // Validar que sea un string
  if (typeof phone !== 'string') {
    return false;
  }

  // Limpiar el teléfono
  const cleaned = cleanChileanPhone(phone);

  // Debe tener exactamente 9 dígitos
  if (cleaned.length !== 9) {
    return false;
  }

  // Debe contener solo números
  if (!/^\d{9}$/.test(cleaned)) {
    return false;
  }

  // Validar que sea un número válido de Chile
  const firstDigit = cleaned[0];

  // Móviles: comienzan con 9
  if (firstDigit === '9') {
    return true;
  }

  // Fijos: código de área válido
  // Santiago: comienza con 2
  // Otras regiones: comienzan con 3, 4, 5, 6, 7
  const validAreaCodes = ['2', '3', '4', '5', '6', '7'];

  return validAreaCodes.includes(firstDigit);
}

/**
 * Obtiene el tipo de teléfono chileno
 * @param phone Número de teléfono (limpio)
 * @returns 'mobile' | 'landline' | null
 */
export function getChileanPhoneType(
  phone: string,
): 'mobile' | 'landline' | null {
  if (!validateChileanPhone(phone)) {
    return null;
  }

  const cleaned = cleanChileanPhone(phone);

  if (cleaned[0] === '9') {
    return 'mobile';
  }

  return 'landline';
}

/**
 * Formatea un número de teléfono chileno
 * @param phone Número de teléfono a formatear
 * @param includeCountryCode Si se debe incluir el código de país +56
 * @returns Número formateado o null si es inválido
 */
export function formatChileanPhone(
  phone: string,
  includeCountryCode: boolean = false,
): string | null {
  if (!validateChileanPhone(phone)) {
    return null;
  }

  const cleaned = cleanChileanPhone(phone);
  const type = getChileanPhoneType(cleaned);

  let formatted = '';

  if (type === 'mobile') {
    // Formato móvil: 9 1234 5678
    formatted = `${cleaned[0]} ${cleaned.substring(1, 5)} ${cleaned.substring(5)}`;
  } else {
    // Formato fijo según región
    if (cleaned[0] === '2') {
      // Santiago: 2 2345 6789
      formatted = `${cleaned[0]} ${cleaned.substring(1, 5)} ${cleaned.substring(5)}`;
    } else {
      // Otras regiones: 32 234 5678
      formatted = `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
    }
  }

  return includeCountryCode ? `+56 ${formatted}` : formatted;
}

/**
 * Decorador de validación para números de teléfono chilenos
 * @param validationOptions Opciones de validación
 * @returns Decorador
 */
export function IsChileanPhone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isChileanPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return validateChileanPhone(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Chilean phone number`;
        },
      },
    });
  };
}

/**
 * Decorador Transform que limpia y normaliza un número de teléfono chileno
 * Normaliza al formato +56XXXXXXXXX (código de país + 9 dígitos)
 */
export function CleanChileanPhone() {
  return Transform(({ value, key }) => {
    // Si es null o undefined, retornar tal cual
    if (value === null || value === undefined) {
      return value;
    }

    // Si no es string, lanzar error
    if (typeof value !== 'string') {
      throw new BadRequestException(`${key} must be a string`);
    }

    // Limpiar el teléfono (obtiene solo los 9 dígitos)
    const cleaned = cleanChileanPhone(value);

    // Retornar con el código de país
    return `+56${cleaned}`;
  });
}
