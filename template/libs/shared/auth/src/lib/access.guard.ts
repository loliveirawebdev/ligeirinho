import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_ROUTE_KEY, REQUIRED_PERMISSIONS_KEY } from './access-metadata';
import type { AuthenticatedRequest } from './authenticated-user';
import { TokenVerifier } from './token-verifier';

/** Deny by default: public routes pass, every other route needs a valid token with all declared permissions. */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenVerifier: TokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handlerAndClass = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean | undefined>(PUBLIC_ROUTE_KEY, handlerAndClass) === true) {
      return true;
    }
    const requiredPermissions = this.reflector.getAllAndOverride<string[] | undefined>(
      REQUIRED_PERMISSIONS_KEY,
      handlerAndClass,
    );
    if (requiredPermissions === undefined || requiredPermissions.length === 0) {
      throw new ForbiddenException('This route declares no permission');
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authenticatedUser = await this.authenticate(request);
    if (!requiredPermissions.every((permission) => authenticatedUser.permissions.includes(permission))) {
      throw new ForbiddenException();
    }
    request.authenticatedUser = authenticatedUser;
    return true;
  }

  private async authenticate(request: AuthenticatedRequest) {
    const authorizationHeader = request.headers['authorization'];
    const bearerPrefix = 'Bearer ';
    if (typeof authorizationHeader !== 'string' || !authorizationHeader.startsWith(bearerPrefix)) {
      throw new UnauthorizedException();
    }
    return this.tokenVerifier.verify(authorizationHeader.slice(bearerPrefix.length)).catch(() => {
      throw new UnauthorizedException();
    });
  }
}
