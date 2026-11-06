import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { createTestToken } from '@app/shared-auth/testing';

const ACCESS_TOKEN_STORAGE_KEY = 'app.accessToken';

/** Each test signs in as a brand-new user, so tests never share data and run in parallel. */
export async function signInAsNewUser(page: Page, permissions: readonly string[]): Promise<void> {
  const accessToken = await createTestToken(
    { userId: randomUUID(), permissions },
    {
      secret: process.env['TOKEN_SECRET'] ?? '',
      issuer: process.env['TOKEN_ISSUER'] ?? '',
      audience: process.env['TOKEN_AUDIENCE'] ?? '',
    },
  );
  await page.addInitScript(
    ([storageKey, token]) => {
      sessionStorage.setItem(storageKey, token);
    },
    [ACCESS_TOKEN_STORAGE_KEY, accessToken] as const,
  );
}
