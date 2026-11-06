const PARAMETER_PLACEHOLDER = '{}';
const LEADING_VARIABLES = /^(\{\{[^}]*\}\})+/;
const SCHEME_AND_HOST = /^[a-z][a-z\d+.-]*:\/\/[^/]*/i;
const PARAMETER_SEGMENT = /^(:.+|\{\{[^}]+\}\}|\{[^}]+\})$/;

/**
 * Turns a Bruno request URL into the comparable form: no `{{baseUrl}}` (any leading variable), no scheme or host,
 * no query string or fragment, no trailing slash, and every path parameter as `{}`.
 */
export function normalizeRequestUrl(url: string): string {
  const withoutBase = url.trim().replace(LEADING_VARIABLES, '').replace(SCHEME_AND_HOST, '');
  const withoutQuery = withoutBase.split(/[?#]/)[0] ?? '';
  return normalizeSegments(withoutQuery);
}

/** Turns an OpenAPI path (`/tasks/{taskId}`) into the comparable form (`/tasks/{}`). */
export function normalizeOpenApiPath(path: string): string {
  return normalizeSegments(path);
}

/** The folder a request for this path must live in: its static segments joined by `/` (`''` for the root). */
export function expectedFolderFor(path: string): string {
  return pathSegments(path)
    .filter((segment) => !isParameterSegment(segment))
    .join('/');
}

export function isParameterSegment(segment: string): boolean {
  return PARAMETER_SEGMENT.test(segment);
}

export function pathSegments(path: string): string[] {
  return path.split('/').filter((segment) => segment !== '');
}

function normalizeSegments(path: string): string {
  const segments = pathSegments(path).map((segment) => (isParameterSegment(segment) ? PARAMETER_PLACEHOLDER : segment));
  return `/${segments.join('/')}`;
}
