// import {
//   Injectable,
//   CanActivate,
//   ExecutionContext,
//   ForbiddenException,
//   Inject,
//   Logger,
//   forwardRef,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { SCOPE_NAME } from 'src/common/enums/scopes.enum';
// import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
// import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
// import { JwtPayload } from '../strategies/jwt.strategy';
// import { PermissionsService } from 'src/permissions/permissions.service';
// import { ValidatePermissionsDto } from 'src/permissions/dtos/validate-permissions.dto';
// import { errorToLog } from 'src/common/utils/error-to-log';
// import { IMongoId } from 'src/common/validators/mongo-id';

// @Injectable()
// export class PermissionsGuard implements CanActivate {
//   private readonly logger = new Logger(PermissionsGuard.name);

//   constructor(
//     private reflector: Reflector,
//     @Inject(forwardRef(() => PermissionsService))
//     private readonly permissionsService: PermissionsService,
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     // 1. Verificar si la ruta es pública
//     const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     if (isPublic) {
//       return true;
//     }

//     const request = context.switchToHttp().getRequest();
//     const user = request.user as JwtPayload;

//     if (!user) {
//       this.logger.warn('No user found in request');
//       return true;
//     }

//     // 2. Obtener permisos del decorador @RequirePermissions
//     const permissions = this.reflector.getAllAndOverride<SCOPE_NAME[]>(
//       PERMISSIONS_KEY,
//       [context.getHandler(), context.getClass()],
//     );

//     if (!permissions || permissions.length === 0) {
//       this.logger.debug(
//         `No @RequirePermissions decorator found for ${request.method} ${request.path}, allowing access`,
//       );
//       return true;
//     }

//     return this.validatePermissions(user, permissions);
//   }

//   /**
//    * Valida permisos usando la configuración del decorador @RequirePermissions
//    */
//   private async validatePermissions(
//     user: JwtPayload,
//     permissions: SCOPE_NAME[],
//   ): Promise<boolean> {
//     this.logger.debug(`Validating permissions: ${permissions.join(', ')}`);

//     try {
//       const validateDto: ValidatePermissionsDto = {
//         requiredPermissions: permissions,
//         profileId: user.profileId as unknown as IMongoId,
//       };

//       this.logger.debug(
//         `Validating permissions: ${JSON.stringify(validateDto)}`,
//       );

//       const response =
//         await this.permissionsService.validatePermissions(validateDto);

//       if (!response.hasPermission) {
//         this.logger.warn(`Permission denied: ${response.message}`);
//         throw new ForbiddenException(
//           response.message || 'Insufficient permissions',
//         );
//       }

//       this.logger.log(`Permission granted for user ${user.profileId}`);
//       return true;
//     } catch (error) {
//       if (error instanceof ForbiddenException) {
//         throw error;
//       }
//       this.logger.error(errorToLog('Error validating permissions', error));
//       throw new ForbiddenException('Error validating permissions');
//     }
//   }
// }
