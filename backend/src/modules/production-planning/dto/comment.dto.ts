import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @ApiProperty({ 
    description: 'The comment text content',
    example: 'This issue has been resolved after checking the material quality.',
    maxLength: 2000
  })
  @IsNotEmpty({ message: 'Comment text is required' })
  @IsString({ message: 'Comment text must be a string' })
  @MaxLength(2000, { message: 'Comment text must not exceed 2000 characters' })
  @Transform(({ value }: { value: any }) => value?.trim())
  commentText: string;

  @ApiProperty({ 
    description: 'ID of the remark this comment belongs to',
    format: 'uuid'
  })
  @IsNotEmpty({ message: 'Remark ID is required' })
  @IsUUID(4, { message: 'Remark ID must be a valid UUID' })
  remarkId: string;
}

export class UpdateCommentDto {
  @ApiPropertyOptional({ 
    description: 'Updated comment text content',
    example: 'This issue has been resolved after thorough material quality inspection.',
    maxLength: 2000
  })
  @IsOptional()
  @IsString({ message: 'Comment text must be a string' })
  @MaxLength(2000, { message: 'Comment text must not exceed 2000 characters' })
  @Transform(({ value }: { value: any }) => value?.trim() || undefined)
  commentText?: string;
}

export class CommentResponseDto {
  @ApiProperty({ description: 'Comment ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'ID of the remark this comment belongs to', format: 'uuid' })
  remarkId: string;

  @ApiProperty({ description: 'Comment text content' })
  commentText: string;

  @ApiProperty({ description: 'User ID who created the comment', format: 'uuid' })
  createdBy: string;

  @ApiProperty({ description: 'Comment creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Comment last update timestamp' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Creator user information' })
  creator?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export class CommentFilterDto {
  @ApiPropertyOptional({ 
    description: 'Remark ID to filter comments',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID(4, { message: 'Remark ID must be a valid UUID' })
  remarkId?: string;

  @ApiPropertyOptional({ 
    description: 'User ID to filter comments by creator',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page' })
  limit?: number;
}