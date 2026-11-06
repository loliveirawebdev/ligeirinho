import 'reflect-metadata';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { type INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule, createProductionAdapters } from './app/app.module';
import { buildOpenApiDocument, configureApp } from './app/configure-app';
import { readEnvironment } from './app/environment';

const EXPORT_OPENAPI_FLAG = '--export-openapi';

async function createApp(): Promise<{ app: INestApplication; port: number }> {
  const environment = readEnvironment(process.env);
  const appModule = AppModule.create(environment, createProductionAdapters(environment));
  const app = process.argv.includes(EXPORT_OPENAPI_FLAG)
    ? await NestFactory.create(appModule, { logger: false })
    : await NestFactory.create(appModule);
  configureApp(app, environment);
  return { app, port: environment.port };
}

async function serve(): Promise<void> {
  const { app, port } = await createApp();
  SwaggerModule.setup('docs', app, buildOpenApiDocument(app), { jsonDocumentUrl: 'openapi.json' });
  await app.listen(port);
  Logger.log(`API listening on port ${port}`);
}

/** Writes the contract that Spectral and the Bruno drift check read, without listening. */
async function exportOpenApi(outputPath: string): Promise<void> {
  const { app } = await createApp();
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(buildOpenApiDocument(app), null, 2)}\n`);
  await app.close();
}

const exportFlagIndex = process.argv.indexOf(EXPORT_OPENAPI_FLAG);
void (exportFlagIndex === -1 ? serve() : exportOpenApi(process.argv[exportFlagIndex + 1] ?? 'dist/openapi.json'));
