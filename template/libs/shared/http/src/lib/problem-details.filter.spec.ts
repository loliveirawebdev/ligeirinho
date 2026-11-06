import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { DomainError } from '@app/shared-kernel';
import { ProblemDetailsFilter } from './problem-details.filter';

class SeatsSoldOut extends DomainError {
  readonly type = 'seats-sold-out';
  constructor() {
    super('No seats left');
  }
}

class UnmappedBusinessError extends DomainError {
  readonly type = 'unmapped-business-error';
  constructor() {
    super('Nobody mapped me');
  }
}

interface SentResponse {
  status?: number;
  contentType?: string;
  body?: unknown;
}

/** A tiny stand-in for the Express response that records what the filter sent. */
function captureResponse() {
  const sentResponse: SentResponse = {};
  const response = {
    status(status: number) {
      sentResponse.status = status;
      return response;
    },
    type(contentType: string) {
      sentResponse.contentType = contentType;
      return response;
    },
    json(body: unknown) {
      sentResponse.body = body;
      return response;
    },
  };
  const host = new ExecutionContextHost([{}, response]);
  return { host, sentResponse };
}

describe('problem details filter', () => {
  const filter = new ProblemDetailsFilter({ 'seats-sold-out': 409 });

  it('maps a business error to its status', () => {
    const { host, sentResponse } = captureResponse();
    filter.catch(new SeatsSoldOut(), host);
    expect(sentResponse).toEqual({
      status: 409,
      contentType: 'application/problem+json',
      body: { type: 'https://errors.app.local/seats-sold-out', title: 'Seats sold out', status: 409, detail: 'No seats left' },
    });
  });

  it('answers 500 for a business error nobody mapped', () => {
    const { host, sentResponse } = captureResponse();
    filter.catch(new UnmappedBusinessError(), host);
    expect(sentResponse.status).toBe(500);
  });

  it('keeps the status of HTTP exceptions', () => {
    const { host, sentResponse } = captureResponse();
    filter.catch(new ForbiddenException(), host);
    expect(sentResponse.status).toBe(403);
  });

  it('lists validation messages', () => {
    const { host, sentResponse } = captureResponse();
    filter.catch(new NotFoundException({ message: ['title must be a string'] }), host);
    expect(sentResponse.body).toMatchObject({ errors: ['title must be a string'] });
  });

  it('hides unexpected errors behind a generic 500', () => {
    const { host, sentResponse } = captureResponse();
    filter.catch(new TypeError('secret internals'), host);
    expect(sentResponse.body).toEqual({ type: 'https://errors.app.local/internal-error', title: 'Internal error', status: 500 });
  });
});
