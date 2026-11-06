/**
 * Base class for business errors. The presentation layer maps each `type` to an HTTP status and a
 * Problem Details response in a single place, so use cases never know about HTTP.
 */
export abstract class DomainError extends Error {
  abstract readonly type: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
