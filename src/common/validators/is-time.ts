import { Matches, ValidationOptions } from "class-validator";

export const IsTime = (options?: ValidationOptions) =>
  Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Debe tener formato HH:mm',
    ...options,
  });