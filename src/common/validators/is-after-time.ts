import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsTimeAfter(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isAfter',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          if (!value || !relatedValue) return true;

          const [h1, m1] = relatedValue.split(':').map(Number);
          const [h2, m2] = value.split(':').map(Number);

          const startMinutes = h1 * 60 + m1;
          const endMinutes = h2 * 60 + m2;

          return endMinutes > startMinutes;
        },
      },
    });
  };
}