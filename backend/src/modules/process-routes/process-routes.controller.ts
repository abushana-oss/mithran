import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProcessRoutesService } from './process-routes.service';
import {
  CreateProcessRouteDto,
  UpdateProcessRouteDto,
  QueryProcessRoutesDto,
  CreateProcessRouteStepDto,
  UpdateProcessRouteStepDto,
  ReorderStepsDto,
} from './dto/process-routes.dto';
import {
  ProcessRouteResponseDto,
  ProcessRouteListResponseDto,
  ProcessRouteStepResponseDto,
  CostBreakdownDto,
} from './dto/process-route-response.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AccessToken } from '../../common/decorators/access-token.decorator';

@ApiTags('Process Routes')
@ApiBearerAuth()
@Controller({ path: 'process-routes', version: '1' })
export class ProcessRoutesController {
  constructor(private readonly processRoutesService: ProcessRoutesService) {}

  // ============================================================================
  // PROCESS ROUTES - CRUD ENDPOINTS
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'Get all process routes' })
  @ApiResponse({ status: 200, description: 'Process routes retrieved successfully', type: ProcessRouteListResponseDto })
  async findAll(@Query() query: QueryProcessRoutesDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessRouteListResponseDto> {
    return this.processRoutesService.findAll(query, user.id, token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get process route by ID' })
  @ApiResponse({ status: 200, description: 'Process route retrieved successfully', type: ProcessRouteResponseDto })
  @ApiResponse({ status: 404, description: 'Process route not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessRouteResponseDto> {
    return this.processRoutesService.findOne(id, user.id, token);
  }

  @Post()
  @ApiOperation({ summary: 'Create new process route' })
  @ApiResponse({ status: 201, description: 'Process route created successfully', type: ProcessRouteResponseDto })
  async create(@Body() createDto: CreateProcessRouteDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessRouteResponseDto> {
    return this.processRoutesService.create(createDto, user.id, token);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update process route' })
  @ApiResponse({ status: 200, description: 'Process route updated successfully', type: ProcessRouteResponseDto })
  async update(@Param('id') id: string, @Body() updateDto: UpdateProcessRouteDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessRouteResponseDto> {
    return this.processRoutesService.update(id, updateDto, user.id, token);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete process route' })
  @ApiResponse({ status: 200, description: 'Process route deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user: any, @AccessToken() token: string) {
    return this.processRoutesService.remove(id, user.id, token);
  }

  // ============================================================================
  // PROCESS ROUTE STEPS - CRUD ENDPOINTS
  // ============================================================================

  @Post(':id/steps')
  @ApiOperation({ summary: 'Add step to process route' })
  @ApiResponse({ status: 201, description: 'Step added successfully', type: ProcessRouteStepResponseDto })
  async addStep(@Body() createDto: CreateProcessRouteStepDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<ProcessRouteStepResponseDto> {
    return this.processRoutesService.addStep(createDto, user.id, token);
  }

  @Put(':routeId/steps/:stepId')
  @ApiOperation({ summary: 'Update process route step' })
  @ApiResponse({ status: 200, description: 'Step updated successfully', type: ProcessRouteStepResponseDto })
  async updateStep(
    @Param('stepId') stepId: string,
    @Body() updateDto: UpdateProcessRouteStepDto,
    @CurrentUser() user: any,
    @AccessToken() token: string,
  ): Promise<ProcessRouteStepResponseDto> {
    return this.processRoutesService.updateStep(stepId, updateDto, user.id, token);
  }

  @Delete(':routeId/steps/:stepId')
  @ApiOperation({ summary: 'Delete process route step' })
  @ApiResponse({ status: 200, description: 'Step deleted successfully' })
  async removeStep(@Param('stepId') stepId: string, @CurrentUser() user: any, @AccessToken() token: string) {
    return this.processRoutesService.removeStep(stepId, user.id, token);
  }

  @Patch(':id/reorder-steps')
  @ApiOperation({ summary: 'Reorder process route steps' })
  @ApiResponse({ status: 200, description: 'Steps reordered successfully' })
  async reorderSteps(
    @Param('id') routeId: string,
    @Body() reorderDto: ReorderStepsDto,
    @CurrentUser() user: any,
    @AccessToken() token: string,
  ) {
    return this.processRoutesService.reorderSteps(routeId, reorderDto, user.id, token);
  }

  // ============================================================================
  // COST CALCULATION ENDPOINT
  // ============================================================================

  @Post(':id/calculate-cost')
  @ApiOperation({ summary: 'Calculate cost for process route' })
  @ApiResponse({ status: 200, description: 'Cost calculated successfully', type: CostBreakdownDto })
  async calculateCost(@Param('id') routeId: string, @CurrentUser() user: any, @AccessToken() token: string): Promise<CostBreakdownDto> {
    return this.processRoutesService.calculateRouteCost(routeId, user.id, token);
  }
}
