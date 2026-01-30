import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupplierNominationsService } from './supplier-nominations.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessToken } from '../../common/decorators/access-token.decorator';
import {
  CreateSupplierNominationDto,
  CreateCriteriaDto,
  UpdateVendorEvaluationDto,
  CreateEvaluationScoreDto,
  SupplierNominationDto,
  SupplierNominationSummaryDto,
  VendorEvaluationDto,
  NominationCriteriaDto,
  EvaluationScoreDto
} from './dto/supplier-nomination.dto';

@ApiTags('supplier-nominations')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('supplier-nominations')
export class SupplierNominationsController {
  constructor(
    private readonly supplierNominationsService: SupplierNominationsService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new supplier nomination' })
  @ApiResponse({
    status: 201,
    description: 'Supplier nomination created successfully',
    type: SupplierNominationDto
  })
  create(
    @CurrentUser('id') userId: string,
    @AccessToken() token: string,
    @Body() createDto: CreateSupplierNominationDto
  ): Promise<SupplierNominationDto> {
    return this.supplierNominationsService.create(userId, createDto, token);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all nominations for a project' })
  @ApiResponse({
    status: 200,
    description: 'Nominations retrieved successfully',
    type: [SupplierNominationSummaryDto]
  })
  findByProject(
    @CurrentUser('id') userId: string,
    @AccessToken() token: string,
    @Param('projectId') projectId: string
  ): Promise<SupplierNominationSummaryDto[]> {
    return this.supplierNominationsService.findByProject(userId, projectId, token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier nomination by ID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier nomination retrieved successfully',
    type: SupplierNominationDto
  })
  findOne(
    @CurrentUser('id') userId: string,
    @AccessToken() token: string,
    @Param('id') id: string
  ): Promise<SupplierNominationDto> {
    return this.supplierNominationsService.findOne(userId, id, token);
  }

  @Put(':id/criteria')
  @ApiOperation({ summary: 'Update nomination criteria' })
  @ApiResponse({
    status: 200,
    description: 'Criteria updated successfully',
    type: [NominationCriteriaDto]
  })
  updateCriteria(
    @CurrentUser('id') userId: string,
    @AccessToken() token: string,
    @Param('id') nominationId: string,
    @Body() criteria: CreateCriteriaDto[]
  ): Promise<NominationCriteriaDto[]> {
    return this.supplierNominationsService.updateCriteria(
      userId,
      nominationId,
      criteria,
      token
    );
  }

  @Put('evaluations/:evaluationId')
  @ApiOperation({ summary: 'Update vendor evaluation' })
  @ApiResponse({
    status: 200,
    description: 'Vendor evaluation updated successfully',
    type: VendorEvaluationDto
  })
  updateVendorEvaluation(
    @CurrentUser('id') userId: string,
    @AccessToken() token: string,
    @Param('evaluationId') evaluationId: string,
    @Body() updateDto: UpdateVendorEvaluationDto
  ): Promise<VendorEvaluationDto> {
    return this.supplierNominationsService.updateVendorEvaluation(
      userId,
      evaluationId,
      updateDto,
      token
    );
  }

  @Put('evaluations/:evaluationId/scores')
  @ApiOperation({ summary: 'Update evaluation scores for a vendor' })
  @ApiResponse({
    status: 200,
    description: 'Evaluation scores updated successfully',
    type: [EvaluationScoreDto]
  })
  updateEvaluationScores(
    @CurrentUser('id') userId: string,
    @AccessToken() token: string,
    @Param('evaluationId') evaluationId: string,
    @Body() scores: CreateEvaluationScoreDto[]
  ): Promise<EvaluationScoreDto[]> {
    return this.supplierNominationsService.updateEvaluationScores(
      userId,
      evaluationId,
      scores,
      token
    );
  }

  @Post(':id/vendors')
  @ApiOperation({ summary: 'Add vendors to nomination' })
  @ApiResponse({
    status: 200,
    description: 'Vendors added successfully',
    type: [VendorEvaluationDto]
  })
  addVendors(
    @CurrentUser('id') userId: string,
    @AccessToken() token: string,
    @Param('id') nominationId: string,
    @Body('vendorIds') vendorIds: string[]
  ): Promise<VendorEvaluationDto[]> {
    return this.supplierNominationsService.addVendorsToNomination(
      userId,
      nominationId,
      vendorIds,
      token
    );
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete nomination process' })
  @ApiResponse({
    status: 200,
    description: 'Nomination completed successfully',
    type: SupplierNominationDto
  })
  complete(
    @CurrentUser('id') userId: string,
    @AccessToken() token: string,
    @Param('id') nominationId: string
  ): Promise<SupplierNominationDto> {
    return this.supplierNominationsService.completeNomination(
      userId,
      nominationId,
      token
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update supplier nomination' })
  @ApiResponse({
    status: 200,
    description: 'Supplier nomination updated successfully',
    type: SupplierNominationDto
  })
  update(
    @CurrentUser('id') userId: string,
    @AccessToken() token: string,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateSupplierNominationDto>
  ): Promise<SupplierNominationDto> {
    return this.supplierNominationsService.update(userId, id, updateDto, token);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete supplier nomination' })
  @ApiResponse({
    status: 200,
    description: 'Supplier nomination deleted successfully'
  })
  remove(
    @CurrentUser('id') userId: string,
    @AccessToken() token: string,
    @Param('id') id: string
  ): Promise<void> {
    return this.supplierNominationsService.remove(userId, id, token);
  }
}