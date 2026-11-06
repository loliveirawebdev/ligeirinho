import {
  checkedOperations,
  isJsonObject,
  objectAt,
  parametersOf,
  responsesOf,
  type JsonObject,
  type OpenApiOperation,
} from '../openapi-operations.js';
import type { PathsCheck, PathsFinding } from '../paths-function.js';
import { isCollectionPath } from '../path-segments.js';

const listPropertyNames: readonly string[] = ['items', 'data'];

function isArraySchema(schema: unknown): boolean {
  return isJsonObject(schema) && schema.type === 'array';
}

function hasListProperty(schema: JsonObject): boolean {
  const properties = objectAt(schema, 'properties') ?? {};
  return listPropertyNames.some((propertyName) => isArraySchema(properties[propertyName]));
}

/** An array, or an envelope with an array `items` / `data` (also through `allOf`). */
function isListSchema(schema: unknown): boolean {
  if (!isJsonObject(schema)) {
    return false;
  }
  const allOf = schema.allOf;
  const composedSchemas = Array.isArray(allOf) ? allOf.filter(isJsonObject) : [];
  return isArraySchema(schema) || [schema, ...composedSchemas].some(hasListProperty);
}

function returnsList(openApiOperation: OpenApiOperation): boolean {
  const successResponse = objectAt(responsesOf(openApiOperation), '200');
  const content = successResponse === undefined ? {} : (objectAt(successResponse, 'content') ?? {});
  return Object.values(content).some((mediaType) => isJsonObject(mediaType) && isListSchema(mediaType.schema));
}

function isPaginated(openApiOperation: OpenApiOperation): boolean {
  const queryNames = parametersOf(openApiOperation)
    .filter((parameter) => parameter.location === 'query')
    .map((parameter) => parameter.name);
  return (queryNames.includes('cursor') || queryNames.includes('page')) && queryNames.includes('limit');
}

/** rules/scale.md: lists are always paginated (`cursor` or `page`, plus `limit`). */
export const paginatedCollections: PathsCheck = (paths) =>
  checkedOperations(paths)
    .filter((openApiOperation) => openApiOperation.method === 'get' && isCollectionPath(openApiOperation.pathKey))
    .filter((collectionGet) => returnsList(collectionGet) && !isPaginated(collectionGet))
    .map(
      (collectionGet): PathsFinding => ({
        message: `GET ${collectionGet.pathKey}: a list must be paginated with a "cursor" (or "page") and a "limit" query parameter`,
        pathInPaths: [collectionGet.pathKey, 'get'],
      }),
    );
