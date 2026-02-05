import { IsUUID, IsNumber, IsOptional, IsString, IsDateString, IsEnum, Min } from 'class-validator';

export enum DeliveryStatus {
  PENDING = 'pending',
  ORDERED = 'ordered',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  DELAYED = 'delayed'
}

export enum QualityStatus {
  PENDING = 'pending',
  INSPECTED = 'inspected',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REWORK_REQUIRED = 'rework_required'
}

export class CreateLotVendorAssignmentDto {
  @IsUUID()
  productionLotId: string;

  @IsUUID()
  bomItemId: string;

  @IsUUID()
  vendorId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  requiredQuantity: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost?: number = 0;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateLotVendorAssignmentDto {
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  requiredQuantity?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsEnum(DeliveryStatus)
  deliveryStatus?: DeliveryStatus;

  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsDateString()
  actualDeliveryDate?: string;

  @IsOptional()
  @IsEnum(QualityStatus)
  qualityStatus?: QualityStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkVendorAssignmentDto {
  @IsUUID()
  productionLotId: string;

  assignments: CreateLotVendorAssignmentDto[];
}