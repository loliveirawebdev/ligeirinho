import { toUserId } from '@app/shared-kernel';
import { jwtVerify } from 'jose';
import type { AuthenticatedUser } from './authenticated-user';

export interface TokenSettings {
  readonly secret: string;
  readonly issuer: string;
  readonly audience: string;
}

export class InvalidToken extends Error {
  constructor(reason: string) {
    super(`Invalid token: ${reason}`);
  }
}

export const TOKEN_SETTINGS = Symbol('TokenSettings');

export class TokenVerifier {
  private readonly secretKey: Uint8Array;

  constructor(private readonly tokenSettings: TokenSettings) {
    this.secretKey = new TextEncoder().encode(tokenSettings.secret);
  }

  async verify(token: string): Promise<AuthenticatedUser> {
    const verification = await jwtVerify(token, this.secretKey, {
      issuer: this.tokenSettings.issuer,
      audience: this.tokenSettings.audience,
      algorithms: ['HS256'],
    }).catch((verificationError: unknown) => {
      throw new InvalidToken(verificationError instanceof Error ? verificationError.message : 'verification failed');
    });
    const { sub: subject, permissions } = verification.payload;
    if (subject === undefined || !isStringList(permissions)) {
      throw new InvalidToken('subject or permissions missing');
    }
    return { id: toUserId(subject), permissions };
  }
}

function isStringList(candidate: unknown): candidate is string[] {
  return Array.isArray(candidate) && candidate.every((entry) => typeof entry === 'string');
}
