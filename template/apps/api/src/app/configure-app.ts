import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import type { Environment } from './environment';

/** Shared by main.ts, the OpenAPI export and the HTTP tests, so they all see the same app. */
export function configureApp(app: INestApplication, environment: Pick<Environment, 'webOrigin'>): void {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableCors({ origin: environment.webOrigin, exposedHeaders: ['Location'] });
  app.enableShutdownHooks();
}

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const documentConfig = new DocumentBuilder().setTitle('API').setVersion('1.0').addBearerAuth().build();
  // operationId = method name (listTasks), so generated clients and Bruno requests get readable names.
  return SwaggerModule.createDocument(app, documentConfig, { operationIdFactory: (_controllerKey, methodKey) => methodKey });
}
