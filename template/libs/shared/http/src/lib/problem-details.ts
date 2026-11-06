import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PROBLEM_JSON_MEDIA_TYPE = 'application/problem+json';

/** RFC 9457 Problem Details: one error format for every client. */
export class ProblemDetails {
  @ApiProperty({ example: 'https://errors.app.local/task-not-found' })
  type!: string;

  @ApiProperty({ example: 'Task not found' })
  title!: string;

  @ApiProperty({ example: 404 })
  status!: number;

  @ApiPropertyOptional({ example: 'Task 1 was not found' })
  detail?: string;

  @ApiPropertyOptional({ type: [String], description: 'Validation messages, when the request was invalid' })
  errors?: string[];
}
