import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca una ruta como pública, omitiendo la autenticación JWT
 *
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * async login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
