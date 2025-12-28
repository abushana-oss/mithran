/**
 * Shared BOM types and enums
 * Single source of truth for BOM-related type definitions
 */

export enum BOMItemType {
  ASSEMBLY = 'assembly',
  SUB_ASSEMBLY = 'sub_assembly',
  CHILD_PART = 'child_part',
}

export const ITEM_TYPE_LABELS: Record<BOMItemType, string> = {
  [BOMItemType.ASSEMBLY]: 'Assembly',
  [BOMItemType.SUB_ASSEMBLY]: 'Sub-Assembly',
  [BOMItemType.CHILD_PART]: 'Child Part',
};
