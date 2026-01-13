import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';

/**
 * Team Member Roles and Permissions
 *
 * OWNER: Full access - Can edit project, manage team, delete project
 * ADMIN: Can edit project and manage team members
 * MEMBER: Can edit project data (BOM, processes, etc.)
 * VIEWER: Can only view project (read-only access)
 */
export enum TeamMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export class AddTeamMemberDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: TeamMemberRole, example: TeamMemberRole.MEMBER })
  @IsEnum(TeamMemberRole)
  @IsOptional()
  role?: TeamMemberRole;
}

export class UpdateTeamMemberDto {
  @ApiProperty({ enum: TeamMemberRole, example: TeamMemberRole.ADMIN })
  @IsEnum(TeamMemberRole)
  role: TeamMemberRole;
}

export class TeamMemberResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;

  @ApiProperty({ enum: TeamMemberRole, example: TeamMemberRole.MEMBER })
  role: TeamMemberRole;

  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  addedAt: string;

  static fromDatabase(row: any): TeamMemberResponseDto {
    const dto = new TeamMemberResponseDto();
    dto.id = row.id;
    dto.userId = row.user_id;
    dto.email = row.email;
    dto.name = row.name || undefined;
    dto.role = row.role;
    dto.addedAt = row.created_at;
    return dto;
  }
}

export class TeamMembersListResponseDto {
  @ApiProperty({ type: [TeamMemberResponseDto] })
  members: TeamMemberResponseDto[];

  @ApiProperty({ example: 5 })
  total: number;
}
