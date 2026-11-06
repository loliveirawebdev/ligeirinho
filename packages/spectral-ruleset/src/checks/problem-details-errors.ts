import { checkedOperations, isJsonObject, objectAt, responsesOf } from '../openapi-operations.js';
import type { PathsCheck, PathsFinding } from '../paths-function.js';

export const problemDetailsMediaType = 'application/problem+json';

/** `404`, `4XX`, `503`, `5XX`. */
function isErrorStatus(status: string): boolean {
  return /^[45]([0-9]{2}|XX)$/i.test(status);
}

function usesProblemDetails(errorResponse: unknown): boolean {
  if (!isJsonObject(errorResponse)) {
    return false;
  }
  const mediaTypes = Object.keys(objectAt(errorResponse, 'content') ?? {});
  return mediaTypes.length > 0 && mediaTypes.every((mediaType) => mediaType === problemDetailsMediaType);
}

/** rules/rest-api.md: errors in Problem Details format (RFC 9457). */
export const problemDetailsErrors: PathsCheck = (paths) =>
  checkedOperations(paths).flatMap((openApiOperation) =>
    Object.entries(responsesOf(openApiOperation))
      .filter(([status, errorResponse]) => isErrorStatus(status) && !usesProblemDetails(errorResponse))
      .map(
        ([status]): PathsFinding => ({
          message:
            `${openApiOperation.method.toUpperCase()} ${openApiOperation.pathKey}: the ${status} response must be ` +
            `Problem Details (${problemDetailsMediaType}, RFC 9457)`,
          pathInPaths: [openApiOperation.pathKey, openApiOperation.method, 'responses', status],
        }),
      ),
  );
