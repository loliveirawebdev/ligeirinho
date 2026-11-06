import { SignJWT } from 'jose';
import type { TokenSettings } from '../lib/token-verifier';

export const TEST_TOKEN_SETTINGS: TokenSettings = {
  secret: 'test-secret-that-is-only-used-in-tests-0001',
  issuer: 'app-local',
  audience: 'app-api',
};

export interface TestTokenClaims {
  readonly userId: string;
  readonly permissions: readonly string[];
  readonly expiresIn?: string;
}

/** Issues tokens for tests, the seed and e2e. Never used by the running application. */
export function createTestToken(claims: TestTokenClaims, tokenSettings: TokenSettings = TEST_TOKEN_SETTINGS): Promise<string> {
  return new SignJWT({ permissions: [...claims.permissions] })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.userId)
    .setIssuer(tokenSettings.issuer)
    .setAudience(tokenSettings.audience)
    .setIssuedAt()
    .setExpirationTime(claims.expiresIn ?? '12h')
    .sign(new TextEncoder().encode(tokenSettings.secret));
}
