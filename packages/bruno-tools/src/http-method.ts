export const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export function isHttpMethod(candidate: string): candidate is HttpMethod {
  return HTTP_METHODS.some((method) => method === candidate);
}
