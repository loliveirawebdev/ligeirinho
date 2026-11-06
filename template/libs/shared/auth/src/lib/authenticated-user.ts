import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserId } from '@app/shared-kernel';

export interface AuthenticatedUser {
  readonly id: UserId;
  readonly permissions: readonly string[];
}

export interface AuthenticatedRequest {
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  authenticatedUser?: AuthenticatedUser;
}

export class MissingAuthenticatedUser extends Error {
  constructor() {
    super('CurrentUser was used on a route without authentication; mark it with @RequirePermission');
  }
}

export const CurrentUser = createParamDecorator((_unused: unknown, context: ExecutionContext): AuthenticatedUser => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (request.authenticatedUser === undefined) {
    throw new MissingAuthenticatedUser();
  }
  return request.authenticatedUser;
});
