import { createTestToken, TEST_TOKEN_SETTINGS } from '../testing';
import { InvalidToken, TokenVerifier } from './token-verifier';

describe('token verifier', () => {
  const tokenVerifier = new TokenVerifier(TEST_TOKEN_SETTINGS);

  it('reads the user and permissions from a valid token', async () => {
    const token = await createTestToken({ userId: 'user-1', permissions: ['tasks:read'] });
    await expect(tokenVerifier.verify(token)).resolves.toEqual({ id: 'user-1', permissions: ['tasks:read'] });
  });

  it('rejects a token signed with another secret', async () => {
    const token = await createTestToken(
      { userId: 'user-1', permissions: [] },
      { ...TEST_TOKEN_SETTINGS, secret: 'another-secret-that-is-long-enough-0002' },
    );
    await expect(tokenVerifier.verify(token)).rejects.toThrow(InvalidToken);
  });

  it('rejects a token for another audience', async () => {
    const token = await createTestToken({ userId: 'user-1', permissions: [] }, { ...TEST_TOKEN_SETTINGS, audience: 'other-api' });
    await expect(tokenVerifier.verify(token)).rejects.toThrow(InvalidToken);
  });

  it('rejects an expired token', async () => {
    const token = await createTestToken({ userId: 'user-1', permissions: [], expiresIn: '-1m' });
    await expect(tokenVerifier.verify(token)).rejects.toThrow(InvalidToken);
  });
});
