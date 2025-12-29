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
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UpdateMaterialDto, QueryMaterialsDto } from './dto/materials.dto';
import { MaterialResponseDto, MaterialListResponseDto } from './dto/material-response.dto';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AccessToken } from '../../common/decorators/access-token.decorator';

@ApiTags('Materials')
@ApiBearerAuth()
@Controller({ path: 'materials', version: '1' })
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all materials' })
  @ApiResponse({ status: 200, description: 'Materials retrieved successfully', type: MaterialListResponseDto })
  async findAll(@Query() query: QueryMaterialsDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<MaterialListResponseDto> {
    return this.materialsService.findAll(query, user.id, token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by ID' })
  @ApiResponse({ status: 200, description: 'Material retrieved successfully', type: MaterialResponseDto })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any, @AccessToken() token: string): Promise<MaterialResponseDto> {
    return this.materialsService.findOne(id, user.id, token);
  }

  @Post()
  @ApiOperation({ summary: 'Create new material' })
  @ApiResponse({ status: 201, description: 'Material created successfully', type: MaterialResponseDto })
  async create(@Body() createDto: CreateMaterialDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<MaterialResponseDto> {
    return this.materialsService.create(createDto, user.id, token);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update material' })
  @ApiResponse({ status: 200, description: 'Material updated successfully', type: MaterialResponseDto })
  async update(@Param('id') id: string, @Body() updateDto: UpdateMaterialDto, @CurrentUser() user: any, @AccessToken() token: string): Promise<MaterialResponseDto> {
    return this.materialsService.update(id, updateDto, user.id, token);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete material' })
  @ApiResponse({ status: 200, description: 'Material deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() user: any, @AccessToken() token: string) {
    return this.materialsService.remove(id, user.id, token);
  }
}
