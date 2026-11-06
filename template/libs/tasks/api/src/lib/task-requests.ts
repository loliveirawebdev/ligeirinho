import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MAXIMUM_PAGE_LIMIT } from '@app/shared-kernel';
import { MAXIMUM_TASK_TITLE_LENGTH } from '@app/tasks-domain';
import { Type } from 'class-transformer';
import { Equals, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateTaskRequest {
  @ApiProperty({ minLength: 1, maxLength: MAXIMUM_TASK_TITLE_LENGTH, example: 'Write the plan' })
  @IsString()
  @Length(1, MAXIMUM_TASK_TITLE_LENGTH)
  title!: string;
}

export class UpdateTaskRequest {
  @ApiProperty({ enum: [true], description: 'Only completing is supported; completing twice is harmless' })
  @Equals(true)
  completed!: true;
}

export class ListTasksRequest {
  @ApiPropertyOptional({ format: 'uuid', description: 'nextCursor from the previous page' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: MAXIMUM_PAGE_LIMIT, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAXIMUM_PAGE_LIMIT)
  limit?: number;
}
