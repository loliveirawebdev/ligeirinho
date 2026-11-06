/** rules/rest-api.md "Exceptions by name only". Each one covers the path itself and everything under it. */
export const exemptPathPrefixes: readonly string[] = ['/oauth2', '/health', '/me', '/.well-known'];

export function isExemptPath(pathKey: string): boolean {
  return exemptPathPrefixes.some((prefix) => pathKey === prefix || pathKey.startsWith(`${prefix}/`));
}
