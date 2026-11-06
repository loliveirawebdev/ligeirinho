import { checkedOperations, parametersOf, type OpenApiParameter } from '../openapi-operations.js';
import type { PathsCheck } from '../paths-function.js';

/** Compared without case, `-` or `_`: `apiKey`, `api-key` and `API_KEY` are the same name. */
export const secretParameterNames: readonly string[] = [
  'code', 'password', 'secret', 'token', 'key', 'apikey', 'api-key', 'access_token', 'refresh_token',
];

/** A name ending in one of these words is a secret too: `inviteToken`, `client_secret`, `newPassword`. */
const secretWords: readonly string[] = ['password', 'secret', 'token'];

function normalizedName(name: string): string {
  return name.toLowerCase().replaceAll(/[-_]/g, '');
}

function lastWordOf(name: string): string {
  const words = name.split(/[-_]|(?=[A-Z])/).filter((word) => word.length > 0);
  return (words.at(-1) ?? '').toLowerCase();
}

function isSecretLike(parameter: OpenApiParameter): boolean {
  const isInUrl = parameter.location === 'path' || parameter.location === 'query';
  const isSecretName = secretParameterNames.map(normalizedName).includes(normalizedName(parameter.name));
  return isInUrl && (isSecretName || secretWords.includes(lastWordOf(parameter.name)));
}

export const noSecretsInUrls: PathsCheck = (paths) =>
  checkedOperations(paths).flatMap((openApiOperation) =>
    parametersOf(openApiOperation)
      .filter(isSecretLike)
      .map((parameter) => ({
        message:
          `${openApiOperation.method.toUpperCase()} ${openApiOperation.pathKey}: ${parameter.location} parameter ` +
          `"${parameter.name}" looks like a secret; URLs end up in logs and history, send it in the body or a header`,
        pathInPaths: [openApiOperation.pathKey, openApiOperation.method],
      })),
  );
