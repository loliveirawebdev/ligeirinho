import type { ApiOperation } from '../openapi/api-operation.js';
import type { BodyProperty } from '../openapi/request-body.js';
import { isParameterSegment, pathSegments } from '../paths/url-path.js';

const INDENT = '  ';

/** File name for an operation: its operationId in kebab-case, or method + path when there is none. */
export function requestFileName(operation: ApiOperation): string {
  const baseName = operation.operationId ?? `${operation.method} ${operation.path}`;
  return `${toKebabCase(baseName)}.bru`;
}

export function toKebabCase(text: string): string {
  return text
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .split(/[^A-Za-z\d]+/)
    .filter((word) => word !== '')
    .map((word) => word.toLowerCase())
    .join('-');
}

export function renderRequest(operation: ApiOperation, sequence: number): string {
  const blocks = [
    dictionaryBlock('meta', [
      ['name', operation.operationId ?? `${operation.method.toUpperCase()} ${operation.path}`],
      ['type', 'http'],
      ['seq', String(sequence)],
    ]),
    dictionaryBlock(operation.method, [
      ['url', `{{baseUrl}}${toBrunoPath(operation.path)}`],
      ['body', operation.requestBody === undefined ? 'none' : 'json'],
      ['auth', operation.requiresAuth ? 'bearer' : 'none'],
    ]),
    renderPathParameters(operation.path),
    operation.requiresAuth ? dictionaryBlock('auth:bearer', [['token', '{{token}}']]) : undefined,
    operation.requestBody === undefined ? undefined : renderJsonBody(operation.requestBody.requiredProperties),
  ];
  return `${blocks.filter((block) => block !== undefined).join('\n\n')}\n`;
}

function toBrunoPath(path: string): string {
  return path.replace(/\{([^}]+)\}/g, ':$1');
}

function renderPathParameters(path: string): string | undefined {
  const names = pathSegments(path)
    .filter(isParameterSegment)
    .map((segment) => segment.slice(1, -1));
  return names.length === 0 ? undefined : dictionaryBlock('params:path', names.map((name) => [name, '']));
}

function renderJsonBody(requiredProperties: readonly BodyProperty[]): string {
  const skeleton = Object.fromEntries(requiredProperties.map((property) => [property.name, placeholderFor(property)]));
  const indentedJson = JSON.stringify(skeleton, null, 2)
    .split('\n')
    .map((line) => `${INDENT}${line}`);
  return ['body:json {', ...indentedJson, '}'].join('\n');
}

function placeholderFor(property: BodyProperty): unknown {
  if (property.enumValues.length > 0) {
    return property.enumValues[0];
  }
  switch (property.schemaType) {
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    case 'unknown':
      return null;
  }
}

function dictionaryBlock(name: string, entries: readonly (readonly [string, string])[]): string {
  return [`${name} {`, ...entries.map(([key, value]) => `${INDENT}${key}: ${value}`), '}'].join('\n');
}
