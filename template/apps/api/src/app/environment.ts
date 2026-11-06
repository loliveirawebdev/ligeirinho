export interface Environment {
  readonly port: number;
  readonly databaseUrl: string;
  readonly webOrigin: string;
  readonly tokenSecret: string;
  readonly tokenIssuer: string;
  readonly tokenAudience: string;
}

export class InvalidEnvironment extends Error {
  constructor(problems: readonly string[]) {
    super(`The environment is invalid:\n- ${problems.join('\n- ')}`);
  }
}

const MINIMUM_SECRET_LENGTH = 32;

/** Validates the environment once, at startup: a missing or wrong value stops the API (rules/security.md). */
export function readEnvironment(variables: Readonly<Record<string, string | undefined>>): Environment {
  const problems: string[] = [];
  const requireVariable = (name: string): string => {
    const value = variables[name];
    if (value === undefined || value.trim() === '') {
      problems.push(`${name} is required`);
      return '';
    }
    return value;
  };
  const port = Number(variables['PORT'] ?? '3000');
  if (!Number.isInteger(port) || port <= 0) {
    problems.push('PORT must be a positive integer');
  }
  const tokenSecret = requireVariable('TOKEN_SECRET');
  if (tokenSecret !== '' && tokenSecret.length < MINIMUM_SECRET_LENGTH) {
    problems.push(`TOKEN_SECRET must have at least ${MINIMUM_SECRET_LENGTH} characters`);
  }
  const environment: Environment = {
    port,
    databaseUrl: requireVariable('DATABASE_URL'),
    webOrigin: requireVariable('WEB_ORIGIN'),
    tokenSecret,
    tokenIssuer: requireVariable('TOKEN_ISSUER'),
    tokenAudience: requireVariable('TOKEN_AUDIENCE'),
  };
  if (problems.length > 0) {
    throw new InvalidEnvironment(problems);
  }
  return environment;
}
