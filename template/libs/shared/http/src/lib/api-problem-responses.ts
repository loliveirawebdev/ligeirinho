import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { PROBLEM_JSON_MEDIA_TYPE, ProblemDetails } from './problem-details';

const STATUS_DESCRIPTIONS: Readonly<Record<number, string>> = {
  400: 'The request is invalid',
  401: 'Authentication is missing or invalid',
  403: 'The caller is not allowed to do this',
  404: 'The resource does not exist or belongs to someone else',
  409: 'The request conflicts with the current state',
  422: 'The request breaks a business rule',
  429: 'Too many requests',
};

/** Documents error responses as Problem Details, so the OpenAPI contract matches what the filter sends. */
export function ApiProblemResponses(...statuses: number[]): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiExtraModels(ProblemDetails),
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: STATUS_DESCRIPTIONS[status] ?? 'Error',
        content: { [PROBLEM_JSON_MEDIA_TYPE]: { schema: { $ref: getSchemaPath(ProblemDetails) } } },
      }),
    ),
  );
}
