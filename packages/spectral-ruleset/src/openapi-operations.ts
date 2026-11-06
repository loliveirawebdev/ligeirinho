import { isExemptPath } from './exempt-paths.js';

export type JsonObject = Record<string, unknown>;

export const httpMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

export type HttpMethod = (typeof httpMethods)[number];

export interface OpenApiOperation {
  readonly pathKey: string;
  readonly method: HttpMethod;
  readonly pathItem: JsonObject;
  readonly operation: JsonObject;
}

export interface OpenApiParameter {
  readonly name: string;
  readonly location: string;
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function objectAt(container: JsonObject, key: string): JsonObject | undefined {
  const value = container[key];
  return isJsonObject(value) ? value : undefined;
}

/** The path keys of `paths` that ligeirinho's rules apply to (exceptions removed). */
export function checkedPathKeys(paths: unknown): string[] {
  return isJsonObject(paths) ? Object.keys(paths).filter((pathKey) => !isExemptPath(pathKey)) : [];
}

function operationsOfPath(paths: JsonObject, pathKey: string): OpenApiOperation[] {
  const pathItem = objectAt(paths, pathKey);
  if (pathItem === undefined) {
    return [];
  }
  return httpMethods.flatMap((method) => {
    const operation = objectAt(pathItem, method);
    return operation === undefined ? [] : [{ pathKey, method, pathItem, operation }];
  });
}

/** Every operation of `paths`, except the ones under an exempt path. */
export function checkedOperations(paths: unknown): OpenApiOperation[] {
  if (!isJsonObject(paths)) {
    return [];
  }
  return checkedPathKeys(paths).flatMap((pathKey) => operationsOfPath(paths, pathKey));
}

function parametersIn(container: JsonObject): OpenApiParameter[] {
  const parameters = container.parameters;
  if (!Array.isArray(parameters)) {
    return [];
  }
  return parameters.filter(isJsonObject).flatMap((parameter) => {
    const { name, in: location } = parameter;
    return typeof name === 'string' && typeof location === 'string' ? [{ name, location }] : [];
  });
}

/** Path-level and operation-level parameters of an operation. */
export function parametersOf(openApiOperation: OpenApiOperation): OpenApiParameter[] {
  return [...parametersIn(openApiOperation.pathItem), ...parametersIn(openApiOperation.operation)];
}

export function responsesOf(openApiOperation: OpenApiOperation): JsonObject {
  return objectAt(openApiOperation.operation, 'responses') ?? {};
}
