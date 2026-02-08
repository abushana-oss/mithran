import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '@/common/guards/supabase-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ProductionProcessService } from '../services/production-process.service';
import {
  CreateProductionProcessDto,
  UpdateProductionProcessDto,
} from '../dto/production-process.dto';
import {
  CreateLotVendorAssignmentDto,
  UpdateLotVendorAssignmentDto,
} from '../dto/vendor-assignment.dto';
import {
  ProductionProcessResponseDto,
  LotVendorAssignmentResponseDto as VendorAssignmentResponseDto,
} from '../dto/production-lot.dto';

@ApiTags('Production Processes')
@Controller('production-planning/processes')
@UseGuards(SupabaseAuthGuard)
export class ProductionProcessController {
  constructor(private readonly productionProcessService: ProductionProcessService) { }

  @Post('/')
  @ApiOperation({ summary: 'Create a new production process' })
  @ApiResponse({ type: ProductionProcessResponseDto })
  async createProductionProcess(
    @Body() createDto: CreateProductionProcessDto,
    @CurrentUser() user: any
  ): Promise<ProductionProcessResponseDto> {
    return this.productionProcessService.createProductionProcess(createDto, user.id);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get production process by ID' })
  @ApiResponse({ type: ProductionProcessResponseDto })
  async getProductionProcess(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<ProductionProcessResponseDto> {
    return this.productionProcessService.getProductionProcessById(id, user.id);
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update production process' })
  @ApiResponse({ type: ProductionProcessResponseDto })
  async updateProductionProcess(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductionProcessDto,
    @CurrentUser() user: any
  ): Promise<ProductionProcessResponseDto> {
    return this.productionProcessService.updateProductionProcess(id, updateDto, user.id);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete production process' })
  async deleteProductionProcess(
    @Param('id') id: string,
    @CurrentUser() user: any
  ): Promise<void> {
    return this.productionProcessService.deleteProductionProcess(id, user.id);
  }

  @Get('/lot/:lotId')
  @ApiOperation({ summary: 'Get all processes for a production lot' })
  @ApiResponse({ type: [ProductionProcessResponseDto] })
  async getProcessesByLot(
    @Param('lotId') lotId: string,
    @CurrentUser() user: any
  ): Promise<ProductionProcessResponseDto[]> {
    return this.productionProcessService.getProcessesByLot(lotId, user.id);
  }

  @Post('/:processId/vendor-assignments')
  @ApiOperation({ summary: 'Assign vendor to process materials' })
  @ApiResponse({ type: VendorAssignmentResponseDto })
  async assignVendorToProcess(
    @Param('processId') processId: string,
    @Body() assignmentDto: CreateLotVendorAssignmentDto,
    @CurrentUser() user: any
  ): Promise<VendorAssignmentResponseDto> {
    return this.productionProcessService.assignVendorToProcess(processId, assignmentDto, user.id);
  }

  @Get('/:processId/vendor-assignments')
  @ApiOperation({ summary: 'Get vendor assignments for process' })
  @ApiResponse({ type: [VendorAssignmentResponseDto] })
  async getProcessVendorAssignments(
    @Param('processId') processId: string,
    @CurrentUser() user: any
  ): Promise<VendorAssignmentResponseDto[]> {
    return this.productionProcessService.getProcessVendorAssignments(processId, user.id);
  }

  @Put('/vendor-assignments/:assignmentId')
  @ApiOperation({ summary: 'Update vendor assignment' })
  @ApiResponse({ type: VendorAssignmentResponseDto })
  async updateVendorAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() updateDto: UpdateLotVendorAssignmentDto,
    @CurrentUser() user: any
  ): Promise<VendorAssignmentResponseDto> {
    return this.productionProcessService.updateVendorAssignment(assignmentId, updateDto, user.id);
  }

  @Put('/:processId/schedule')
  @ApiOperation({ summary: 'Update process schedule' })
  @ApiResponse({ type: ProductionProcessResponseDto })
  async updateProcessSchedule(
    @Param('processId') processId: string,
    @Body() scheduleDto: {
      planned_start_date: string;
      planned_end_date: string;
      assigned_department?: string;
      responsible_person?: string;
    },
    @CurrentUser() user: any
  ): Promise<ProductionProcessResponseDto> {
    return this.productionProcessService.updateProcessSchedule(processId, scheduleDto, user.id);
  }

  @Put('/:processId/status')
  @ApiOperation({ summary: 'Update process status' })
  @ApiResponse({ type: ProductionProcessResponseDto })
  async updateProcessStatus(
    @Param('processId') processId: string,
    @Body() statusDto: {
      status: string;
      completion_percentage?: number;
      actual_start_date?: string;
      actual_end_date?: string;
    },
    @CurrentUser() user: any
  ): Promise<ProductionProcessResponseDto> {
    return this.productionProcessService.updateProcessStatus(processId, statusDto, user.id);
  }
}