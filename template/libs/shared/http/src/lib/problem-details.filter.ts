import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { DomainError } from '@app/shared-kernel';
import type { Response } from 'express';
import { PROBLEM_JSON_MEDIA_TYPE, type ProblemDetails } from './problem-details';

/** Maps each business error type to an HTTP status. Each area exports its own map; the app merges them. */
export type DomainErrorStatuses = Readonly<Record<string, number>>;

const ERROR_TYPE_BASE_URL = 'https://errors.app.local/';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  constructor(private readonly domainErrorStatuses: DomainErrorStatuses) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const problem = this.toProblem(exception);
    response.status(problem.status).type(PROBLEM_JSON_MEDIA_TYPE).json(problem);
  }

  private toProblem(exception: unknown): ProblemDetails {
    if (exception instanceof DomainError) {
      return this.fromDomainError(exception);
    }
    if (exception instanceof HttpException) {
      return fromHttpException(exception);
    }
    this.logger.error('Unexpected error', exception instanceof Error ? exception.stack : String(exception));
    return { type: `${ERROR_TYPE_BASE_URL}internal-error`, title: 'Internal error', status: 500 };
  }

  private fromDomainError(domainError: DomainError): ProblemDetails {
    const status = this.domainErrorStatuses[domainError.type];
    if (status === undefined) {
      this.logger.error(`Business error type "${domainError.type}" has no HTTP status mapped`);
    }
    return {
      type: `${ERROR_TYPE_BASE_URL}${domainError.type}`,
      title: titleFromType(domainError.type),
      status: status ?? 500,
      detail: domainError.message,
    };
  }
}

function fromHttpException(httpException: HttpException): ProblemDetails {
  const status = httpException.getStatus();
  const validationMessages = readValidationMessages(httpException.getResponse());
  return {
    type: `${ERROR_TYPE_BASE_URL}http-${status}`,
    title: httpException.message,
    status,
    ...(validationMessages === undefined ? {} : { errors: validationMessages }),
  };
}

function readValidationMessages(exceptionResponse: string | object): string[] | undefined {
  if (typeof exceptionResponse !== 'object' || !('message' in exceptionResponse)) {
    return undefined;
  }
  const { message } = exceptionResponse;
  return Array.isArray(message) ? message.map(String) : undefined;
}

function titleFromType(errorType: string): string {
  const words = errorType.split('-').join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
