import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProcessTemplatesService } from './process-templates.service';
import {
  CreateProcessTemplateDto,
  UpdateProcessTemplateDto,
  QueryProcessTemplatesDto,
  CreateProcessTemplateStepDto,
  UpdateProcessTemplateStepDto,
  ApplyTemplateDto,
} from './dto/process-templates.dto';
import {
  ProcessTemplateResponseDto,
  ProcessTemplateListResponseDto,
  ProcessTemplateStepResponseDto,
} from './dto/process-template-response.dto';
import { ProcessRouteResponseDto } from '../process-routes/dto/process-route-response.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AccessToken } from '../../common/decorators/access-token.decorator';

@ApiTags('Process Templates')
@ApiBearerAuth()
@Controller({ path: 'process-templates', version: '1' })
export class ProcessTemplatesController {
  constructor(private readonly processTemplatesService: ProcessTemplatesService) {}

  // ============================================================================
  // PROCESS TEMPLATES - CRUD ENDPOINTS
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'Get all process templates' })
  @ApiResponse({ status: 200, description: 'Process templates retrieved successfully', type: ProcessTemplateListResponseDto })
  async findAll(@Query() query: QueryProcessTemplatesDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessTemplateListResponseDto> {
    return this.processTemplatesService.findAll(query, user.id, token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get process template by ID' })
  @ApiResponse({ status: 200, description: 'Process template retrieved successfully', type: ProcessTemplateResponseDto })
  @ApiResponse({ status: 404, description: 'Process template not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessTemplateResponseDto> {
    return this.processTemplatesService.findOne(id, user.id, token);
  }

  @Post()
  @ApiOperation({ summary: 'Create new process template' })
  @ApiResponse({ status: 201, description: 'Process template created successfully', type: ProcessTemplateResponseDto })
  async create(@Body() createDto: CreateProcessTemplateDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessTemplateResponseDto> {
    return this.processTemplatesService.create(createDto, user.id, token);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update process template' })
  @ApiResponse({ status: 200, description: 'Process template updated successfully', type: ProcessTemplateResponseDto })
  async update(@Param('id') id: string, @Body() updateDto: UpdateProcessTemplateDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessTemplateResponseDto> {
    return this.processTemplatesService.update(id, updateDto, user.id, token);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete process template' })
  @ApiResponse({ status: 200, description: 'Process template deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user: any, @AccessToken() token: string) {
    return this.processTemplatesService.remove(id, user.id, token);
  }

  // ============================================================================
  // PROCESS TEMPLATE STEPS - CRUD ENDPOINTS
  // ============================================================================

  @Post(':id/steps')
  @ApiOperation({ summary: 'Add step to process template' })
  @ApiResponse({ status: 201, description: 'Step added successfully', type: ProcessTemplateStepResponseDto })
  async addStep(@Body() createDto: CreateProcessTemplateStepDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessTemplateStepResponseDto> {
    return this.processTemplatesService.addStep(createDto, user.id, token);
  }

  @Put(':templateId/steps/:stepId')
  @ApiOperation({ summary: 'Update process template step' })
  @ApiResponse({ status: 200, description: 'Step updated successfully', type: ProcessTemplateStepResponseDto })
  async updateStep(
    @Param('stepId') stepId: string,
    @Body() updateDto: UpdateProcessTemplateStepDto,
    @CurrentUser() user: any,
    @AccessToken() token: string,
  ): Promise<ProcessTemplateStepResponseDto> {
    return this.processTemplatesService.updateStep(stepId, updateDto, user.id, token);
  }

  @Delete(':templateId/steps/:stepId')
  @ApiOperation({ summary: 'Delete process template step' })
  @ApiResponse({ status: 200, description: 'Step deleted successfully' })
  async removeStep(@Param('stepId') stepId: string, @CurrentUser() user: any, @AccessToken() token: string) {
    return this.processTemplatesService.removeStep(stepId, user.id, token);
  }

  // ============================================================================
  // APPLY TEMPLATE ENDPOINT - KEY FEATURE
  // ============================================================================

  @Post('apply-template')
  @ApiOperation({ summary: 'Apply template to BOM item (creates process route with all steps)' })
  @ApiResponse({ status: 201, description: 'Template applied successfully', type: ProcessRouteResponseDto })
  async applyTemplate(@Body() applyDto: ApplyTemplateDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessRouteResponseDto> {
    return this.processTemplatesService.applyTemplate(applyDto, user.id, token);
  }
}
