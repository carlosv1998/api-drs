import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import * as qs from 'qs';
import { ResponseFormatterInterceptor } from './main/interceptors/response-formatter.interceptor';
import { Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './main/filters/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Main');
  const app = await NestFactory.create(AppModule);

  // Configurar query parser antes que nada
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('query parser', (str: string) =>
    qs.parse(str, {
      arrayLimit: 100,
      depth: 10,
    }),
  );

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // ValidationPipe global - DEBE ir antes de filtros e interceptores
  // Nota: NestJS ya incluye body parsers (json, urlencoded) por defecto
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Rechaza requests con propiedades extra
      transform: true, // Transforma los tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true, // Conversión implícita de tipos
      },
    }),
  );

  // Filtros e interceptores
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseFormatterInterceptor());

  await app.listen(envs.port ?? 3000);
  logger.log(`Listening on port ${envs.port ?? 3000}`);
}
bootstrap();
