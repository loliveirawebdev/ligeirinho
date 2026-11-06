import type { HttpInterceptorFn } from '@angular/common/http';

export const ACCESS_TOKEN_STORAGE_KEY = 'app.accessToken';

/**
 * The template ships without a sign-in screen (that is the first feature to build). Until then the token
 * comes from sessionStorage, which the e2e tests and `make seed` fill in.
 */
export const accessTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const accessToken = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (accessToken === null) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }));
};
