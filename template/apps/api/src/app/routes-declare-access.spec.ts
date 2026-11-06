import { Controller, Get, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import { PUBLIC_ROUTE_KEY, REQUIRED_PERMISSIONS_KEY } from '@app/shared-auth';
import { createTestApp } from '../testing/test-app';

// Architecture test (rules/security.md): every route declares a permission or is explicitly @Public().

function declaresAccess(target: object): boolean {
  const isPublic: unknown = Reflect.getMetadata(PUBLIC_ROUTE_KEY, target);
  const permissions: unknown = Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, target);
  return isPublic === true || (Array.isArray(permissions) && permissions.length > 0);
}

function describeRoute(handler: object, label: string): string {
  const method: unknown = Reflect.getMetadata(METHOD_METADATA, handler);
  return `${(typeof method === 'number' ? RequestMethod[method] : undefined) ?? 'UNKNOWN'} ${label}`;
}

function undeclaredRoutesOf(controllerClass: object, controllerName: string): string[] {
  const prototype: unknown = Reflect.get(controllerClass, 'prototype');
  if (declaresAccess(controllerClass) || typeof prototype !== 'object' || prototype === null) {
    return [];
  }
  return Object.getOwnPropertyNames(prototype)
    .filter((methodName) => methodName !== 'constructor')
    .flatMap((methodName) => {
      const handler: unknown = Reflect.get(prototype, methodName);
      if (typeof handler !== 'function' || Reflect.getMetadata(PATH_METADATA, handler) === undefined || declaresAccess(handler)) {
        return [];
      }
      return [describeRoute(handler, `${controllerName}.${methodName}`)];
    });
}

describe('every route declares who can call it', () => {
  it('has no route without a permission or @Public()', async () => {
    const { app } = await createTestApp();
    const controllers = [...app.get(ModulesContainer).values()].flatMap((nestModule) => [...nestModule.controllers.values()]);
    const undeclaredRoutes = controllers.flatMap((controller) =>
      controller.metatype === null ? [] : undeclaredRoutesOf(controller.metatype, String(controller.name)),
    );
    await app.close();
    expect(undeclaredRoutes).toEqual([]);
  });

  it('notices a route without a permission', () => {
    @Controller('undeclared')
    class UndeclaredController {
      @Get()
      list(): string[] {
        return [];
      }
    }
    expect(undeclaredRoutesOf(UndeclaredController, 'UndeclaredController')).toEqual(['GET UndeclaredController.list']);
  });
});
