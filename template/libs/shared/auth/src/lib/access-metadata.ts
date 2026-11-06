import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSIONS_KEY = 'ligeirinho:required-permissions';
export const PUBLIC_ROUTE_KEY = 'ligeirinho:public-route';

/** Every route must declare what it needs. A route with neither this nor @Public() answers 403. */
export const RequirePermission = (...permissions: string[]) => SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

/** Opens a route to anyone. Each use shows up in review (rules/security.md). */
export const Public = () => SetMetadata(PUBLIC_ROUTE_KEY, true);
