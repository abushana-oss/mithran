import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { Logger } from '../../common/logger/logger.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateProjectDto, UpdateProjectDto, QueryProjectsDto } from './dto/projects.dto';
import { ProjectResponseDto, ProjectListResponseDto } from './dto/project-response.dto';
import { AddTeamMemberDto, UpdateTeamMemberDto, TeamMemberResponseDto, TeamMembersListResponseDto } from './dto/project-team-member.dto';
import { validate as isValidUUID } from 'uuid';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly logger: Logger,
  ) {}

  async findAll(query: QueryProjectsDto, userId: string, accessToken: string): Promise<ProjectListResponseDto> {
    this.logger.log('Fetching all projects', 'ProjectsService');

    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100); // Cap at 100 for performance
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let queryBuilder = this.supabaseService
      .getClient(accessToken)
      .from('projects')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.ilike('name', `%${query.search}%`);
    }

    // Apply status filter
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    const { data, error, count } = await queryBuilder;

    if (error) {
      this.logger.error(`Error fetching projects: ${error.message}`, 'ProjectsService');
      throw new InternalServerErrorException(`Failed to fetch projects: ${error.message}`);
    }

    // Transform using static DTO method (type-safe)
    const projects = (data || []).map(row => ProjectResponseDto.fromDatabase(row));

    return {
      projects,
      total: count || 0,
      page,
      limit,
    };
  }

  async findOne(id: string, userId: string, accessToken: string): Promise<ProjectResponseDto> {
    this.logger.log(`Fetching project: ${id}`, 'ProjectsService');

    // Validate UUID format
    if (!this.isValidUUID(id)) {
      this.logger.warn(`Invalid UUID format provided: ${id}`, 'ProjectsService');
      throw new BadRequestException('Invalid project ID format');
    }

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      // Distinguish between different error types
      if (error?.code === 'PGRST116') {
        // PostgreSQL "no rows returned" error
        this.logger.warn(`Project not found: ${id}`, 'ProjectsService');
      } else if (error) {
        this.logger.error(`Database error while fetching project ${id}: ${error.message}`, 'ProjectsService');
      } else {
        this.logger.warn(`Project not found (no data): ${id}`, 'ProjectsService');
      }
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return ProjectResponseDto.fromDatabase(data);
  }

  /**
   * Validate UUID format to prevent invalid queries
   */
  private isValidUUID(id: string): boolean {
    try {
      return isValidUUID(id);
    } catch {
      return false;
    }
  }

  async create(createProjectDto: CreateProjectDto, userId: string, accessToken: string): Promise<ProjectResponseDto> {
    this.logger.log(`Creating project for user: ${userId}`, 'ProjectsService');

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('projects')
      .insert({
        name: createProjectDto.name,
        description: createProjectDto.description,
        country: createProjectDto.country,
        state: createProjectDto.state,
        city: createProjectDto.city,
        status: createProjectDto.status || 'draft',
        quoted_cost: createProjectDto.quotedCost,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error creating project: ${error.message}`, 'ProjectsService');
      throw new InternalServerErrorException(`Failed to create project: ${error.message}`);
    }

    if (!data) {
      this.logger.error('Project creation returned no data', 'ProjectsService');
      throw new InternalServerErrorException('Failed to create project: No data returned');
    }

    return ProjectResponseDto.fromDatabase(data);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string, accessToken: string): Promise<ProjectResponseDto> {
    this.logger.log(`Updating project: ${id}`, 'ProjectsService');

    // Validate UUID format early
    if (!this.isValidUUID(id)) {
      this.logger.warn(`Invalid UUID format for update: ${id}`, 'ProjectsService');
      throw new BadRequestException('Invalid project ID format');
    }

    // Verify project exists and belongs to user (RLS enforces ownership)
    await this.findOne(id, userId, accessToken);

    const updateData: any = {};
    if (updateProjectDto.name !== undefined) updateData.name = updateProjectDto.name;
    if (updateProjectDto.description !== undefined) updateData.description = updateProjectDto.description;
    if (updateProjectDto.country !== undefined) updateData.country = updateProjectDto.country;
    if (updateProjectDto.state !== undefined) updateData.state = updateProjectDto.state;
    if (updateProjectDto.city !== undefined) updateData.city = updateProjectDto.city;
    if (updateProjectDto.status !== undefined) updateData.status = updateProjectDto.status;
    if (updateProjectDto.quotedCost !== undefined) updateData.quoted_cost = updateProjectDto.quotedCost;

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Error updating project: ${error.message}`, 'ProjectsService');
      throw new InternalServerErrorException(`Failed to update project: ${error.message}`);
    }

    return ProjectResponseDto.fromDatabase(data);
  }

  async remove(id: string, userId: string, accessToken: string) {
    this.logger.log(`Deleting project: ${id}`, 'ProjectsService');

    // Validate UUID format early
    if (!this.isValidUUID(id)) {
      this.logger.warn(`Invalid UUID format for delete: ${id}`, 'ProjectsService');
      throw new BadRequestException('Invalid project ID format');
    }

    // Verify project exists and belongs to user (RLS enforces ownership)
    await this.findOne(id, userId, accessToken);

    const { error } = await this.supabaseService
      .getClient(accessToken)
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Error deleting project: ${error.message}`, 'ProjectsService');
      throw new InternalServerErrorException(`Failed to delete project: ${error.message}`);
    }

    return { message: 'Project deleted successfully' };
  }

  async getCostAnalysis(id: string, userId: string, accessToken: string) {
    this.logger.log(`Getting cost analysis for project: ${id}`, 'ProjectsService');

    // Validate UUID format early
    if (!this.isValidUUID(id)) {
      this.logger.warn(`Invalid UUID format for cost analysis: ${id}`, 'ProjectsService');
      throw new BadRequestException('Invalid project ID format');
    }

    // Verify user owns this project
    const project = await this.findOne(id, userId, accessToken);

    // Single optimized query using database function
    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .rpc('get_project_cost_analysis', { project_id_input: id });

    if (error) {
      this.logger.error(`Error fetching cost analysis: ${error.message}`, 'ProjectsService');
      throw new InternalServerErrorException(`Failed to fetch cost analysis: ${error.message}`);
    }

    // RPC returns array with single row
    const analysis = Array.isArray(data) ? data[0] : data;

    return {
      projectId: project.id,
      projectName: project.name,
      totalBOMs: Number(analysis?.total_boms || 0),
      totalItems: Number(analysis?.total_items || 0),
      estimatedCost: Number(analysis?.estimated_cost || 0),
      quotedCost: project.quotedCost || 0,
      costDifference: (project.quotedCost || 0) - Number(analysis?.estimated_cost || 0),
    };
  }

  // ============================================================================
  // TEAM MEMBER MANAGEMENT
  // ============================================================================

  async getTeamMembers(projectId: string, userId: string, accessToken: string): Promise<TeamMembersListResponseDto> {
    this.logger.log(`Getting team members for project: ${projectId}`, 'ProjectsService');

    if (!this.isValidUUID(projectId)) {
      throw new BadRequestException('Invalid project ID format');
    }

    // Verify user has access to this project
    await this.findOne(projectId, userId, accessToken);

    // Query team members
    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('project_team_members')
      .select('id, user_id, role, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Error fetching team members: ${error.message}`, 'ProjectsService');
      throw new InternalServerErrorException(`Failed to fetch team members: ${error.message}`);
    }

    // Fetch user details using admin client
    const adminClient = this.supabaseService.getAdminClient();
    const members = await Promise.all(
      (data || []).map(async (row) => {
        const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(row.user_id);

        if (userError) {
          this.logger.warn(`Failed to fetch user ${row.user_id}: ${userError.message}`);
        }

        return TeamMemberResponseDto.fromDatabase({
          id: row.id,
          user_id: row.user_id,
          email: userData?.user?.email || 'unknown@example.com',
          name: userData?.user?.user_metadata?.name || userData?.user?.user_metadata?.full_name,
          role: row.role,
          created_at: row.created_at,
        });
      })
    );

    return {
      members,
      total: members.length,
    };
  }

  async addTeamMember(projectId: string, dto: AddTeamMemberDto, userId: string, accessToken: string): Promise<TeamMemberResponseDto> {
    this.logger.log(`Adding team member to project: ${projectId}`, 'ProjectsService');

    if (!this.isValidUUID(projectId)) {
      throw new BadRequestException('Invalid project ID format');
    }

    // Verify user owns this project
    await this.findOne(projectId, userId, accessToken);

    // Find user by email using admin client
    const adminClient = this.supabaseService.getAdminClient();
    const { data: usersData, error: userError } = await adminClient.auth.admin.listUsers();

    if (userError) {
      this.logger.error(`Error listing users: ${userError.message}`, 'ProjectsService');
      throw new InternalServerErrorException(`Failed to search for user: ${userError.message}`);
    }

    const targetUser = usersData.users.find(u => u.email === dto.email);
    if (!targetUser) {
      throw new NotFoundException(`User with email ${dto.email} not found`);
    }

    // Add team member
    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('project_team_members')
      .insert({
        project_id: projectId,
        user_id: targetUser.id,
        role: dto.role || 'member',
        added_by: userId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new BadRequestException('User is already a team member');
      }
      this.logger.error(`Error adding team member: ${error.message}`, 'ProjectsService');
      throw new InternalServerErrorException(`Failed to add team member: ${error.message}`);
    }

    return TeamMemberResponseDto.fromDatabase({
      id: data.id,
      user_id: targetUser.id,
      email: targetUser.email,
      name: targetUser.user_metadata?.name || targetUser.user_metadata?.full_name,
      role: data.role,
      created_at: data.created_at,
    });
  }

  async updateTeamMember(projectId: string, memberId: string, dto: UpdateTeamMemberDto, userId: string, accessToken: string): Promise<TeamMemberResponseDto> {
    this.logger.log(`Updating team member ${memberId} in project: ${projectId}`, 'ProjectsService');

    if (!this.isValidUUID(projectId) || !this.isValidUUID(memberId)) {
      throw new BadRequestException('Invalid ID format');
    }

    // Verify user owns this project
    await this.findOne(projectId, userId, accessToken);

    const { data, error } = await this.supabaseService
      .getClient(accessToken)
      .from('project_team_members')
      .update({ role: dto.role })
      .eq('id', memberId)
      .eq('project_id', projectId)
      .select('id, user_id, role, created_at')
      .single();

    if (error) {
      this.logger.error(`Error updating team member: ${error.message}`, 'ProjectsService');
      throw new InternalServerErrorException(`Failed to update team member: ${error.message}`);
    }

    // Get user details using admin client
    const adminClient = this.supabaseService.getAdminClient();
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(data.user_id);

    if (userError) {
      this.logger.warn(`Failed to fetch user ${data.user_id}: ${userError.message}`);
    }

    return TeamMemberResponseDto.fromDatabase({
      id: data.id,
      user_id: data.user_id,
      email: userData?.user?.email || 'unknown@example.com',
      name: userData?.user?.user_metadata?.name || userData?.user?.user_metadata?.full_name,
      role: data.role,
      created_at: data.created_at,
    });
  }

  async removeTeamMember(projectId: string, memberId: string, userId: string, accessToken: string): Promise<{ message: string }> {
    this.logger.log(`Removing team member ${memberId} from project: ${projectId}`, 'ProjectsService');

    if (!this.isValidUUID(projectId) || !this.isValidUUID(memberId)) {
      throw new BadRequestException('Invalid ID format');
    }

    // Verify user owns this project
    await this.findOne(projectId, userId, accessToken);

    const { error } = await this.supabaseService
      .getClient(accessToken)
      .from('project_team_members')
      .delete()
      .eq('id', memberId)
      .eq('project_id', projectId);

    if (error) {
      this.logger.error(`Error removing team member: ${error.message}`, 'ProjectsService');
      throw new InternalServerErrorException(`Failed to remove team member: ${error.message}`);
    }

    return { message: 'Team member removed successfully' };
  }
}
