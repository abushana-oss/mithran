import { BadRequestException } from '@nestjs/common';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

export class UuidValidator {
  static validateUuid(value: string, fieldName: string = 'ID'): void {
    if (!value) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    if (!uuidValidate(value)) {
      throw new BadRequestException(`${fieldName} must be a valid UUID`);
    }

    if (uuidVersion(value) !== 4) {
      throw new BadRequestException(`${fieldName} must be a valid UUID v4`);
    }
  }

  static isValidUuid(value: string): boolean {
    return Boolean(value) && uuidValidate(value) && uuidVersion(value) === 4;
  }
}