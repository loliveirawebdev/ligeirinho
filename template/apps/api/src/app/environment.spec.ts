import { InvalidEnvironment, readEnvironment } from './environment';

const validVariables = {
  DATABASE_URL: 'postgresql://app@db/app',
  WEB_ORIGIN: 'http://localhost:4200',
  TOKEN_SECRET: 'a-secret-with-at-least-thirty-two-characters',
  TOKEN_ISSUER: 'app-local',
  TOKEN_AUDIENCE: 'app-api',
};

describe('environment', () => {
  it('reads a valid environment', () => {
    expect(readEnvironment(validVariables)).toMatchObject({ port: 3000, databaseUrl: 'postgresql://app@db/app' });
  });

  it('refuses to start without required variables', () => {
    expect(() => readEnvironment({})).toThrow(InvalidEnvironment);
  });

  it('refuses a short token secret', () => {
    expect(() => readEnvironment({ ...validVariables, TOKEN_SECRET: 'short' })).toThrow(/TOKEN_SECRET/);
  });
});
