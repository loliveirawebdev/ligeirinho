export class BrunoToolsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class BruSyntaxError extends BrunoToolsError {
  constructor(
    readonly lineNumber: number,
    readonly reason: string,
  ) {
    super(`line ${String(lineNumber)}: ${reason}`);
  }
}

export class MissingMethodBlock extends BrunoToolsError {
  constructor() {
    super('no HTTP method block (get, post, put, patch, delete, head, options)');
  }
}

export class OpenApiUnreadable extends BrunoToolsError {
  constructor(
    readonly source: string,
    readonly reason: string,
  ) {
    super(`cannot read OpenAPI document ${source}: ${reason}`);
  }
}

export class InvalidOpenApiDocument extends BrunoToolsError {
  constructor(readonly reason: string) {
    super(`invalid OpenAPI document: ${reason}`);
  }
}

export class UnresolvableReference extends BrunoToolsError {
  constructor(readonly reference: string) {
    super(`cannot resolve $ref ${reference}`);
  }
}

export class CollectionUnreadable extends BrunoToolsError {
  constructor(
    readonly collectionDirectory: string,
    readonly reason: string,
  ) {
    super(`cannot read Bruno collection ${collectionDirectory}: ${reason}`);
  }
}

export class InvalidEnvironmentValues extends BrunoToolsError {
  constructor(readonly reason: string) {
    super(`invalid environment values: ${reason}`);
  }
}

export class NonLocalEnvironmentRefused extends BrunoToolsError {
  constructor(readonly environmentName: string) {
    super(
      `refusing to write generated values to the "${environmentName}" environment: only "local" holds generated test values (use --force to override)`,
    );
  }
}
